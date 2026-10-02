import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { Server } from 'node:http';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';
import { Database } from '../src/infrastructure/database/database.js';
import { MailService } from '../src/modules/auth/mail.service.js';
import { tokenHash } from '../src/modules/auth/credentials.js';
import type { RoadmapResponseDto } from '../src/modules/roadmaps/roadmap.dto.js';

const password = 'Uma-senha-longa-para-testes!';
interface Actor {
  id: string;
  token: string;
  email: string;
}
describe('BreadCrumbs API with real PostgreSQL', () => {
  let app: INestApplication<Server>;
  let db: Database;
  let admin: Pool;
  let owner: Actor;
  let editor: Actor;
  let commenter: Actor;
  let viewer: Actor;
  let outsider: Actor;
  let throttleApp: INestApplication<Server>;
  const mail = new Map<string, string>();
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const api = () => request(app.getHttpServer());
  const base = '/api/v1';
  const node = (title = 'Módulo', required = true) => ({
    id: randomUUID(),
    type: 'module',
    title,
    position: { x: 0, y: 0 },
    required,
  });
  async function signup(label: string): Promise<Actor> {
    const email = `${label}-${randomUUID()}@example.com`.toLowerCase();
    await api().post(`${base}/auth/register`).send({ name: label, email, password }).expect(200);
    const token = mail.get(email);
    expect(token).toBeTruthy();
    await api().post(`${base}/auth/verify-email`).send({ token }).expect(200);
    const login = await api().post(`${base}/auth/login`).send({ email, password }).expect(200);
    const session = login.body as { accessToken: string };
    const me = await api()
      .get(`${base}/users/me`)
      .auth(session.accessToken, { type: 'bearer' })
      .expect(200);
    return { id: (me.body as { id: string }).id, token: session.accessToken, email };
  }
  async function create(title = 'Japonês', actor = owner): Promise<RoadmapResponseDto> {
    const result = await api()
      .post(`${base}/roadmaps`)
      .auth(actor.token, { type: 'bearer' })
      .send({ title, description: 'Trilha de estudo', category: 'Idiomas', tags: ['iniciante'] })
      .expect(201);
    return result.body as RoadmapResponseDto;
  }
  async function member(id: string, actor: Actor, role: string) {
    await api()
      .put(`${base}/roadmaps/${id}/members`)
      .auth(owner.token, { type: 'bearer' })
      .send({ userId: actor.id, role })
      .expect(200);
  }
  beforeAll(async () => {
    const url = new URL(
      process.env.TEST_DATABASE_URL ??
        'postgresql://breadcrumbs:breadcrumbs_local@localhost:5432/breadcrumbs',
    );
    admin = new Pool({ connectionString: url.toString() });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    url.searchParams.set('options', `-c search_path=${schema}`);
    execFileSync(process.execPath, ['scripts/migrate.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: url.toString() },
      stdio: 'pipe',
    });
    // Applying migrations a second time must be harmless.
    execFileSync(process.execPath, ['scripts/migrate.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: url.toString() },
      stdio: 'pipe',
    });
    db = new Database(new ConfigService({ DATABASE_URL: url.toString() }));
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Database)
      .useValue(db)
      .overrideProvider(MailService)
      .useValue({
        verification: (email: string, token: string) => {
          mail.set(email, token);
          return Promise.resolve();
        },
      })
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.useLogger(false);
    configureApp(app);
    await app.init();
    owner = await signup('Proprietario');
    editor = await signup('Editor');
    commenter = await signup('Comentador');
    viewer = await signup('Visualizador');
    outsider = await signup('Estudante');
  }, 60000);
  afterAll(async () => {
    await throttleApp?.close();
    await app?.close();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    }
  });

  it('requires verification, hides secrets and consumes confirmation only once', async () => {
    const email = `pending-${randomUUID()}@example.com`;
    const registration = await api()
      .post(`${base}/auth/register`)
      .send({ email, password, name: 'Pessoa' })
      .expect(200);
    expect(registration.text).not.toContain('token');
    await api().post(`${base}/auth/login`).send({ email, password }).expect(403);
    const first = mail.get(email);
    await api().post(`${base}/auth/resend-verification`).send({ email }).expect(200);
    await api().post(`${base}/auth/verify-email`).send({ token: first }).expect(400);
    const token = mail.get(email);
    await api().post(`${base}/auth/verify-email`).send({ token }).expect(200);
    await api().post(`${base}/auth/verify-email`).send({ token }).expect(400);
    const [stored] = await db.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE email=$1',
      [email],
    );
    expect(stored?.password_hash).toMatch(/^scrypt-v1:/);
    expect(stored?.password_hash).not.toContain(password);
  });
  it('rejects expired confirmation and expired or revoked sessions', async () => {
    const email = `expired-${randomUUID()}@example.com`;
    await api().post(`${base}/auth/register`).send({ email, password, name: 'Pessoa' }).expect(200);
    await db.query(
      "UPDATE email_verifications SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",
      [tokenHash(mail.get(email)!)],
    );
    await api()
      .post(`${base}/auth/verify-email`)
      .send({ token: mail.get(email) })
      .expect(400);
    const login = await api()
      .post(`${base}/auth/login`)
      .send({ email: owner.email, password })
      .expect(200);
    const token = (login.body as { accessToken: string }).accessToken;
    const [stored] = await db.query<{ token_hash: string }>(
      'SELECT token_hash FROM sessions WHERE token_hash=$1',
      [tokenHash(token)],
    );
    expect(stored?.token_hash).not.toBe(token);
    await api().post(`${base}/auth/logout`).auth(token, { type: 'bearer' }).expect(204);
    await api().get(`${base}/users/me`).auth(token, { type: 'bearer' }).expect(401);
    const next = await api()
      .post(`${base}/auth/login`)
      .send({ email: owner.email, password })
      .expect(200);
    const expired = (next.body as { accessToken: string }).accessToken;
    await db.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1", [
      tokenHash(expired),
    ]);
    await api().get(`${base}/users/me`).auth(expired, { type: 'bearer' }).expect(401);
  });
  it('rejects missing authentication, mass assignment, weak passwords and bad UUIDs', async () => {
    await api().post(`${base}/roadmaps`).send({ title: 'x' }).expect(401);
    await api().get(`${base}/roadmaps/not-a-uuid`).expect(400);
    await api()
      .post(`${base}/auth/register`)
      .send({ name: 'Xx', email: 'x@example.com', password: 'short' })
      .expect(400);
    await api()
      .post(`${base}/roadmaps`)
      .auth(owner.token, { type: 'bearer' })
      .send({ title: 'x', ownerId: outsider.id })
      .expect(400);
    await api().get(`${base}/users/me`).set('Authorization', 'Bearer invalid').expect(401);
    await api()
      .post(`${base}/auth/login`)
      .send({ email: owner.email, password: 'wrong-password-123' })
      .expect(401);
  });
  it('persists branching/disconnected graphs, resources and extensible node types', async () => {
    const roadmap = await create();
    const a = node('Básico');
    const b = node('Prática');
    const c = node('Leitura', false);
    const d = {
      ...node('Extra'),
      type: 'custom-checkpoint',
      resources: [{ label: 'Guia', url: 'https://example.com/guia' }],
    };
    const graph = {
      nodes: [a, b, c, d],
      edges: [
        { id: randomUUID(), source: a.id, target: b.id },
        { id: randomUUID(), source: a.id, target: c.id },
      ],
    };
    await api()
      .put(`${base}/roadmaps/${roadmap.id}/graph`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 1, graph })
      .expect(200);
    const saved = await api()
      .get(`${base}/roadmaps/${roadmap.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(200);
    expect((saved.body as RoadmapResponseDto).graph.nodes).toHaveLength(4);
    expect((saved.body as RoadmapResponseDto).graph.edges).toHaveLength(2);
    expect((saved.body as RoadmapResponseDto).revision).toBe(2);
    const [persisted] = await db.query<{ graph: unknown }>(
      'SELECT graph FROM roadmaps WHERE id=$1',
      [roadmap.id],
    );
    expect(persisted?.graph).toMatchObject({
      nodes: expect.arrayContaining([
        expect.objectContaining({ type: 'custom-checkpoint' }),
      ]) as unknown,
    });
  });
  it('rejects malformed graphs atomically without increasing the revision', async () => {
    const r = await create();
    const a = node();
    const invalid = [
      [],
      { nodes: [a, a], edges: [] },
      { nodes: [a, { ...a, id: a.id.toUpperCase() }], edges: [] },
      { nodes: [[]], edges: [] },
      { nodes: [a], edges: [{ id: randomUUID(), source: a.id, target: randomUUID() }] },
      { nodes: [a], edges: [{ id: randomUUID(), source: a.id, target: a.id }] },
      { nodes: [{ ...a, position: undefined }], edges: [] },
      { nodes: [{ ...a, position: [] }], edges: [] },
      { nodes: [{ ...a, resources: [{ label: 'bad', url: 'javascript:alert(1)' }] }], edges: [] },
    ];
    for (const graph of invalid)
      await api()
        .put(`${base}/roadmaps/${r.id}/graph`)
        .auth(owner.token, { type: 'bearer' })
        .send({ expectedRevision: 1, graph })
        .expect(400);
    await api()
      .put(`${base}/roadmaps/${r.id}/graph`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 1 })
      .expect(400);
    const saved = await api()
      .get(`${base}/roadmaps/${r.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(200);
    expect((saved.body as RoadmapResponseDto).revision).toBe(1);
    expect((saved.body as RoadmapResponseDto).graph.nodes).toEqual([]);
  });
  it('allows one concurrent save and reports conflict for the other', async () => {
    const r = await create();
    const results = await Promise.all(
      ['Primeiro', 'Segundo'].map((title) =>
        api()
          .put(`${base}/roadmaps/${r.id}/graph`)
          .auth(owner.token, { type: 'bearer' })
          .send({ expectedRevision: 1, graph: { nodes: [node(title)], edges: [] } }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('preserves omitted metadata and rejects null fields', async () => {
    const r = await create();
    const updated = await api()
      .patch(`${base}/roadmaps/${r.id}`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 1, title: 'Novo título' })
      .expect(200);
    expect(updated.body).toMatchObject({
      description: 'Trilha de estudo',
      category: 'Idiomas',
      tags: ['iniciante'],
      title: 'Novo título',
    });
    await api()
      .patch(`${base}/roadmaps/${r.id}`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 2, title: null })
      .expect(400);
  });
  it('enforces owner/editor/commenter/viewer capabilities and revocation', async () => {
    const r = await create();
    await member(r.id, editor, 'editor');
    await member(r.id, commenter, 'commenter');
    await member(r.id, viewer, 'viewer');
    await api().get(`${base}/roadmaps/${r.id}`).expect(404);
    await api()
      .get(`${base}/roadmaps/${r.id}`)
      .auth(outsider.token, { type: 'bearer' })
      .expect(404);
    for (const [actor, role] of [
      [owner, 'owner'],
      [editor, 'editor'],
      [commenter, 'commenter'],
      [viewer, 'viewer'],
    ] as const) {
      const response = await api()
        .get(`${base}/roadmaps/${r.id}`)
        .auth(actor.token, { type: 'bearer' })
        .expect(200);
      expect((response.body as RoadmapResponseDto).access).toEqual({
        role,
        canEdit: role === 'owner' || role === 'editor',
        canManage: role === 'owner',
        canComment: role !== 'viewer',
      });
    }
    await api()
      .patch(`${base}/roadmaps/${r.id}`)
      .auth(editor.token, { type: 'bearer' })
      .send({ expectedRevision: 1, title: 'Edição colaborativa' })
      .expect(200);
    for (const actor of [commenter, viewer])
      await api()
        .patch(`${base}/roadmaps/${r.id}`)
        .auth(actor.token, { type: 'bearer' })
        .send({ expectedRevision: 2, title: 'Proibido' })
        .expect(403);
    await api()
      .put(`${base}/roadmaps/${r.id}/visibility`)
      .auth(editor.token, { type: 'bearer' })
      .send({ expectedRevision: 2, visibility: 'public' })
      .expect(403);
    await api()
      .delete(`${base}/roadmaps/${r.id}`)
      .auth(editor.token, { type: 'bearer' })
      .expect(403);
    await api()
      .put(`${base}/roadmaps/${r.id}/members`)
      .auth(editor.token, { type: 'bearer' })
      .send({ userId: outsider.id, role: 'editor' })
      .expect(403);
    await api()
      .put(`${base}/roadmaps/${r.id}/members`)
      .auth(owner.token, { type: 'bearer' })
      .send({ userId: owner.id, role: 'viewer' })
      .expect(400);
    await api()
      .delete(`${base}/roadmaps/${r.id}/members/${editor.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(204);
    await api().get(`${base}/roadmaps/${r.id}`).auth(editor.token, { type: 'bearer' }).expect(404);
  });
  it('explores only public content with filters and bounded pagination', async () => {
    const r = await create('Fotografia Criativa');
    await api()
      .put(`${base}/roadmaps/${r.id}/visibility`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 1, visibility: 'public' })
      .expect(200);
    await create('Fotografia Secreta');
    const result = await api()
      .get(`${base}/explore/roadmaps`)
      .query({
        q: 'Fotografia',
        category: 'Idiomas',
        tag: 'iniciante',
        authorId: owner.id,
        sort: 'trending',
        limit: 1,
      })
      .expect(200);
    expect(result.body).toMatchObject({
      items: [{ id: r.id, title: 'Fotografia Criativa' }],
      page: 1,
      limit: 1,
      hasMore: false,
    });
    expect(result.text).not.toContain('Secreta');
    await api().get(`${base}/explore/roadmaps`).query({ limit: 1000 }).expect(400);
    await api()
      .get(`${base}/explore/roadmaps`)
      .query({ sort: 'title;DROP TABLE users' })
      .expect(400);
    await api().get(`${base}/explore/roadmaps`).query({ q: "' OR 1=1 --" }).expect(200);
    await api()
      .put(`${base}/roadmaps/${r.id}/visibility`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 2, visibility: 'private' })
      .expect(200);
    await api().get(`${base}/roadmaps/${r.id}`).expect(404);
  });
  it('keeps progress individual, counts required nodes and clears deleted nodes', async () => {
    const r = await create();
    await member(r.id, viewer, 'viewer');
    const a = node('Obrigatório');
    const b = node('Opcional', false);
    await api()
      .put(`${base}/roadmaps/${r.id}/graph`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 1, graph: { nodes: [a, b], edges: [] } })
      .expect(200);
    const done = await api()
      .put(`${base}/roadmaps/${r.id}/progress/me/nodes/${a.id}`)
      .auth(viewer.token, { type: 'bearer' })
      .send({ status: 'completed' })
      .expect(200);
    expect(done.body).toMatchObject({ total: 1, completed: 1, percent: 100, remaining: 0 });
    const own = await api()
      .get(`${base}/roadmaps/${r.id}/progress/me`)
      .auth(owner.token, { type: 'bearer' })
      .expect(200);
    expect(own.body).toMatchObject({ completed: 0, percent: 0 });
    await api()
      .put(`${base}/roadmaps/${r.id}/progress/me/nodes/${randomUUID()}`)
      .auth(viewer.token, { type: 'bearer' })
      .send({ status: 'completed' })
      .expect(404);
    await api()
      .put(`${base}/roadmaps/${r.id}/graph`)
      .auth(owner.token, { type: 'bearer' })
      .send({ expectedRevision: 2, graph: { nodes: [b], edges: [] } })
      .expect(200);
    expect(await db.query('SELECT * FROM node_progress WHERE roadmap_id=$1', [r.id])).toEqual([]);
    await api()
      .delete(`${base}/roadmaps/${r.id}/members/${viewer.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(204);
    await api()
      .get(`${base}/roadmaps/${r.id}/progress/me`)
      .auth(viewer.token, { type: 'bearer' })
      .expect(404);
  });
  it('enforces discussion access, parent scope and author/owner deletion', async () => {
    const r = await create();
    await member(r.id, commenter, 'commenter');
    await member(r.id, viewer, 'viewer');
    await api()
      .post(`${base}/roadmaps/${r.id}/comments`)
      .auth(viewer.token, { type: 'bearer' })
      .send({ body: 'Sem permissão' })
      .expect(403);
    const comment = await api()
      .post(`${base}/roadmaps/${r.id}/comments`)
      .auth(commenter.token, { type: 'bearer' })
      .send({ body: 'Como começar?' })
      .expect(201);
    const id = (comment.body as { id: string }).id;
    await api()
      .post(`${base}/roadmaps/${r.id}/comments`)
      .auth(owner.token, { type: 'bearer' })
      .send({ body: 'Pelo início', parentId: id })
      .expect(201);
    const another = await create();
    await api()
      .post(`${base}/roadmaps/${another.id}/comments`)
      .auth(owner.token, { type: 'bearer' })
      .send({ body: 'Cruzado', parentId: id })
      .expect(400);
    await api().get(`${base}/roadmaps/${r.id}/comments`).expect(404);
    await api()
      .delete(`${base}/roadmaps/${r.id}/comments/${id}`)
      .auth(viewer.token, { type: 'bearer' })
      .expect(403);
    await api()
      .delete(`${base}/roadmaps/${r.id}/comments/${id}`)
      .auth(commenter.token, { type: 'bearer' })
      .expect(204);
    expect(await db.query('SELECT id FROM comments WHERE roadmap_id=$1', [r.id])).toEqual([]);
  });
  it('makes reactions idempotent and hides inaccessible favorites', async () => {
    const r = await create();
    await member(r.id, viewer, 'viewer');
    for (const kind of ['like', 'favorite', 'follow', 'like'])
      await api()
        .put(`${base}/roadmaps/${r.id}/reactions/${kind}`)
        .auth(viewer.token, { type: 'bearer' })
        .expect(204);
    const counts = await api()
      .get(`${base}/roadmaps/${r.id}/reactions`)
      .auth(viewer.token, { type: 'bearer' })
      .expect(200);
    expect(counts.body).toMatchObject({
      likes: 1,
      followers: 1,
      mine: ['favorite', 'follow', 'like'],
    });
    const favorites = await api()
      .get(`${base}/roadmaps`)
      .auth(viewer.token, { type: 'bearer' })
      .query({ filter: 'favorite' })
      .expect(200);
    expect(favorites.body).toMatchObject({ items: [{ id: r.id }] });
    await api()
      .delete(`${base}/roadmaps/${r.id}/members/${viewer.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(204);
    const hidden = await api()
      .get(`${base}/roadmaps`)
      .auth(viewer.token, { type: 'bearer' })
      .query({ filter: 'favorite' })
      .expect(200);
    expect(hidden.body).toMatchObject({ items: [] });
    await api()
      .get(`${base}/roadmaps/${r.id}/reactions`)
      .auth(viewer.token, { type: 'bearer' })
      .expect(404);
  });
  it('publishes profiles without email and persists onboarding completion idempotently', async () => {
    const profile = await api().get(`${base}/users/${owner.id}`).expect(200);
    expect(profile.body).not.toHaveProperty('email');
    expect(profile.body).not.toHaveProperty('password_hash');
    await api()
      .patch(`${base}/users/me`)
      .auth(owner.token, { type: 'bearer' })
      .send({ bio: 'Aprender e compartilhar' })
      .expect(200);
    const first = await api()
      .put(`${base}/users/me/onboarding`)
      .auth(owner.token, { type: 'bearer' })
      .expect(200);
    const second = await api()
      .put(`${base}/users/me/onboarding`)
      .auth(owner.token, { type: 'bearer' })
      .expect(200);
    expect(second.body).toEqual(first.body);
    expect((second.body as { onboardingCompletedAt: string }).onboardingCompletedAt).toBeTruthy();
    await api()
      .put(`${base}/users/${owner.id}/follow`)
      .auth(owner.token, { type: 'bearer' })
      .expect(400);
    for (let i = 0; i < 2; i++)
      await api()
        .put(`${base}/users/${owner.id}/follow`)
        .auth(outsider.token, { type: 'bearer' })
        .expect(204);
    const followed = await api().get(`${base}/users/${owner.id}`).expect(200);
    expect(followed.body).toMatchObject({ followers: 1 });
    await api()
      .delete(`${base}/users/${owner.id}/follow`)
      .auth(outsider.token, { type: 'bearer' })
      .expect(204);
  });
  it('cascades a roadmap deletion without affecting accounts', async () => {
    const r = await create();
    await member(r.id, editor, 'editor');
    await api()
      .post(`${base}/roadmaps/${r.id}/comments`)
      .auth(owner.token, { type: 'bearer' })
      .send({ body: 'Comentário' })
      .expect(201);
    await api()
      .delete(`${base}/roadmaps/${r.id}`)
      .auth(owner.token, { type: 'bearer' })
      .expect(204);
    expect(await db.query('SELECT id FROM comments WHERE roadmap_id=$1', [r.id])).toEqual([]);
    expect(
      await db.query('SELECT user_id FROM roadmap_members WHERE roadmap_id=$1', [r.id]),
    ).toEqual([]);
    await api().get(`${base}/users/me`).auth(owner.token, { type: 'bearer' }).expect(200);
  });
  it('limits repeated anonymous authentication attempts', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Database)
      .useValue(db)
      .compile();
    throttleApp = module.createNestApplication<INestApplication<Server>>();
    throttleApp.useLogger(false);
    configureApp(throttleApp);
    await throttleApp.init();
    for (let i = 0; i < 8; i++)
      await request(throttleApp.getHttpServer())
        .post(`${base}/auth/resend-verification`)
        .send({ email: 'absent@example.com' })
        .expect(200);
    await request(throttleApp.getHttpServer())
      .post(`${base}/auth/resend-verification`)
      .send({ email: 'absent@example.com' })
      .expect(429);
  });
});
