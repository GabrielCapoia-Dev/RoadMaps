import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

// Local integration check only: uses the development Mailpit and removes only its own fixture.
const base = 'http://localhost:8080/api/v1';
const mailpit = 'http://localhost:8025';
const email = `smoke-${randomUUID()}@example.com`;
const password = `Smoke-${randomUUID()}!`;
let userId;
let accessToken;
let messageId;
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://breadcrumbs:breadcrumbs_local@localhost:5432/breadcrumbs',
});
async function call(path, method = 'GET', body, status = 200) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  return status === 204 ? undefined : response.json();
}
try {
  await call('/auth/register', 'POST', { email, password, name: 'Verificação local SMTP' });
  const messages = await (await fetch(`${mailpit}/api/v1/messages`)).json();
  const message = messages.messages.find((message) =>
    message.To.some((recipient) => recipient.Address === email),
  );
  assert.ok(message, 'SMTP email must reach local Mailpit');
  messageId = message.ID;
  const detail = await (await fetch(`${mailpit}/api/v1/message/${messageId}`)).json();
  const token = detail.Text.match(/\b[a-f0-9]{64}\b/)?.[0];
  assert.ok(token);
  await call('/auth/verify-email', 'POST', { token });
  accessToken = (await call('/auth/login', 'POST', { email, password })).accessToken;
  userId = (await call('/users/me')).id;
  const roadmap = await call(
    '/roadmaps',
    'POST',
    { title: 'Verificação SMTP e persistência' },
    201,
  );
  const nodeId = randomUUID();
  await call(`/roadmaps/${roadmap.id}/graph`, 'PUT', {
    expectedRevision: 1,
    graph: {
      nodes: [{ id: nodeId, type: 'module', title: 'Aprender', position: { x: 0, y: 0 } }],
      edges: [],
    },
  });
  const progress = await call(`/roadmaps/${roadmap.id}/progress/me/nodes/${nodeId}`, 'PUT', {
    status: 'completed',
  });
  assert.equal(progress.percent, 100);
  await call(`/roadmaps/${roadmap.id}`, 'DELETE', undefined, 204);
  await call('/auth/logout', 'POST', undefined, 204);
  console.log(
    'Product smoke passed: Nginx → API → PostgreSQL/SMTP, verification, login, graph, progress, logout.',
  );
} finally {
  // Email address and user id belong exclusively to this invocation.
  const own = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  userId ??= own.rows[0]?.id;
  if (userId && own.rows[0]?.id === userId) {
    await pool.query('DELETE FROM roadmaps WHERE owner_id=$1', [userId]);
    await pool.query('DELETE FROM users WHERE id=$1 AND email=$2', [userId, email]);
  }
  await pool.end();
  if (messageId)
    await fetch(`${mailpit}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ IDs: [messageId] }),
    });
}
