import assert from 'node:assert/strict';

const baseUrl = (process.env.BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const expectSwagger = process.env.EXPECT_SWAGGER !== 'false';
async function get(path) {
  return fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(10_000) });
}

const frontend = await get('/');
assert.equal(frontend.status, 200, 'Frontend must respond through Nginx');
assert.match(await frontend.text(), /<app-root[\s>]/, 'Angular shell missing');
const health = await get('/api/v1/health');
assert.equal(health.status, 200, 'Versioned API health endpoint must respond');
assert.equal((await health.json()).status, 'ok');
const missing = await get('/api/v1/does-not-exist');
assert.equal(missing.status, 404, 'Unknown API route must not return Angular HTML');
assert.match(missing.headers.get('content-type'), /application\/json/);
const docs = await get('/api/docs');
assert.equal(docs.status, expectSwagger ? 200 : 404);
if (expectSwagger) {
  assert.match(await docs.text(), /swagger-ui/i);
  const schema = await get('/api/docs-json');
  assert.equal(schema.status, 200);
  assert.ok((await schema.json()).paths['/api/v1/health']);
}
console.log(`Smoke checks passed: ${baseUrl} (Swagger: ${expectSwagger})`);
