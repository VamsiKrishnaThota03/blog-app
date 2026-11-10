/**
 * End-to-end API tests.
 *
 * These drive the real Express app with supertest against a real Postgres, so
 * they cover the things unit tests cannot: auth middleware, ownership checks,
 * pagination SQL and the error handler. CI starts Postgres as a service
 * container; locally, `docker compose up -d db` provides the same thing.
 *
 * Without DATABASE_URL the suite skips rather than fails, so `npm test` still
 * works on a machine with no database.
 */
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const hasDb = Boolean(process.env.DATABASE_URL);
const describe = hasDb ? test.describe : test.describe.skip;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-used-in-any-deployment';
process.env.LOG_LEVEL = 'silent';

describe('Blog API', async () => {
  let app;
  let pool;
  let closePool;

  /** A unique email per run so repeated runs never collide on the UNIQUE index. */
  const uniq = () => `u${Date.now()}${Math.floor(Math.random() * 1e6)}@example.test`;

  async function registerUser() {
    const email = uniq();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Author', email, password: 'correct-horse' });
    assert.strictEqual(res.status, 201, `register failed: ${res.text}`);
    return { ...res.body, email };
  }

  test.before(async () => {
    const { createApp } = require('../dist/app');
    const db = require('../dist/config/database');
    closePool = db.closePool;
    pool = await db.initializeDatabase();

    // The schema is idempotent, so applying it here makes the suite
    // self-provisioning against an empty database.
    const fs = require('node:fs');
    const path = require('node:path');
    await pool.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

    app = createApp();
  });

  test.after(async () => {
    if (closePool) await closePool();
  });

  await test('liveness probe does not require the database', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await test('readiness probe reports the database is reachable', async () => {
    const res = await request(app).get('/health/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ready');
  });

  await test('every response carries a correlation id', async () => {
    const res = await request(app).get('/health');
    assert.match(res.headers['x-request-id'], /[0-9a-f-]{8,}/);
  });

  await test('an inbound x-request-id is preserved', async () => {
    const res = await request(app).get('/health').set('x-request-id', 'trace-me-123');
    assert.strictEqual(res.headers['x-request-id'], 'trace-me-123');
  });

  await test('security headers are present and the server is not fingerprintable', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.headers['x-powered-by'], undefined);
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.match(res.headers['content-security-policy'], /default-src 'none'/);
  });

  await test('OpenAPI document is served and documents every route', async () => {
    const res = await request(app).get('/openapi.json');
    assert.strictEqual(res.status, 200);
    for (const p of [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/posts',
      '/api/posts/{id}',
      '/api/posts/user/me',
    ]) {
      assert.ok(res.body.paths[p], `OpenAPI is missing ${p}`);
    }
  });

  await test('registration rejects a short password without creating a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nope', email: uniq(), password: 'short' });
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /6-72/);
  });

  await test('registration rejects a malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nope', email: 'not-an-email', password: 'correct-horse' });
    assert.strictEqual(res.status, 400);
  });

  await test('the same email cannot register twice', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Imposter', email: user.email, password: 'correct-horse' });
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /already exists/i);
  });

  await test('registration never returns the password hash', async () => {
    const user = await registerUser();
    assert.strictEqual(user.password, undefined);
    assert.ok(user.token);
  });

  await test('login succeeds with the right password and fails with the wrong one', async () => {
    const user = await registerUser();

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'correct-horse' });
    assert.strictEqual(ok.status, 200);
    assert.ok(ok.body.token);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-horse' });
    assert.strictEqual(bad.status, 400);
    assert.strictEqual(bad.body.token, undefined);
  });

  await test('login does not reveal whether an account exists', async () => {
    const user = await registerUser();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-horse' });
    const noSuchUser = await request(app)
      .post('/api/auth/login')
      .send({ email: uniq(), password: 'wrong-horse' });

    assert.strictEqual(wrongPassword.status, noSuchUser.status);
    assert.strictEqual(wrongPassword.body.message, noSuchUser.body.message);
  });

  await test('protected routes reject missing, malformed and forged tokens', async () => {
    const none = await request(app).get('/api/auth/me');
    assert.strictEqual(none.status, 401);

    const malformed = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer nonsense');
    assert.strictEqual(malformed.status, 401);

    // Signed with the wrong key: proves the signature is actually verified.
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: 1 }, 'a-different-secret', { algorithm: 'HS256' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    assert.strictEqual(res.status, 401);
  });

  await test('a token signed with alg=none is rejected', async () => {
    // Guards against the classic algorithm-confusion bypass.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 1 })).toString('base64url');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${header}.${payload}.`);
    assert.strictEqual(res.status, 401);
  });

  await test('/api/auth/me returns the caller and never the password', async () => {
    const user = await registerUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${user.token}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, user.id);
    assert.strictEqual(res.body.email, user.email);
    assert.strictEqual(res.body.password, undefined);
  });

  await test('post lifecycle: create, read, update, delete', async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };

    const created = await request(app)
      .post('/api/posts')
      .set(auth)
      .send({ title: 'Hello world', content: 'First body' });
    assert.strictEqual(created.status, 201);
    const id = created.body.id;

    const read = await request(app).get(`/api/posts/${id}`);
    assert.strictEqual(read.status, 200);
    assert.strictEqual(read.body.title, 'Hello world');
    assert.strictEqual(read.body.author_name, 'Test Author');

    const updated = await request(app)
      .put(`/api/posts/${id}`)
      .set(auth)
      .send({ title: 'Hello again', content: 'Second body' });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.title, 'Hello again');

    const deleted = await request(app).delete(`/api/posts/${id}`).set(auth);
    assert.strictEqual(deleted.status, 200);

    const gone = await request(app).get(`/api/posts/${id}`);
    assert.strictEqual(gone.status, 404);
  });

  await test("one author cannot edit or delete another author's post", async () => {
    const owner = await registerUser();
    const attacker = await registerUser();

    const created = await request(app)
      .post('/api/posts')
      .set({ Authorization: `Bearer ${owner.token}` })
      .send({ title: 'Mine', content: 'Private draft' });
    assert.strictEqual(created.status, 201);
    const id = created.body.id;

    const edit = await request(app)
      .put(`/api/posts/${id}`)
      .set({ Authorization: `Bearer ${attacker.token}` })
      .send({ title: 'Hijacked', content: 'Hijacked' });
    assert.strictEqual(edit.status, 404);

    const del = await request(app)
      .delete(`/api/posts/${id}`)
      .set({ Authorization: `Bearer ${attacker.token}` });
    assert.strictEqual(del.status, 404);

    // The post must be untouched.
    const read = await request(app).get(`/api/posts/${id}`);
    assert.strictEqual(read.body.title, 'Mine');
  });

  await test('creating a post requires authentication', async () => {
    const res = await request(app).post('/api/posts').send({ title: 'x', content: 'y' });
    assert.strictEqual(res.status, 401);
  });

  await test('post validation rejects empty and over-long fields', async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };

    const blank = await request(app)
      .post('/api/posts')
      .set(auth)
      .send({ title: '  ', content: 'y' });
    assert.strictEqual(blank.status, 400);

    const longTitle = await request(app)
      .post('/api/posts')
      .set(auth)
      .send({ title: 'x'.repeat(256), content: 'y' });
    assert.strictEqual(longTitle.status, 400);
  });

  await test('pagination caps the page size and reports totals', async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/posts')
        .set(auth)
        .send({ title: `P${i}`, content: 'body' });
    }

    const res = await request(app).get('/api/posts?page=1&limit=2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.posts.length, 2);
    assert.strictEqual(res.body.currentPage, 1);
    assert.ok(res.body.totalPosts >= 3);

    // limit above MAX_PAGE_SIZE must be clamped, not honoured.
    const huge = await request(app).get('/api/posts?limit=10000');
    assert.ok(huge.body.posts.length <= 50);
  });

  await test('a SQL-injection shaped id is rejected as a 404, not executed', async () => {
    const res = await request(app).get('/api/posts/1%3B%20DROP%20TABLE%20posts');
    assert.strictEqual(res.status, 404);
    // The table must still exist.
    const after = await request(app).get('/api/posts');
    assert.strictEqual(after.status, 200);
  });

  await test("/api/posts/user/me returns only the caller's posts", async () => {
    const a = await registerUser();
    const b = await registerUser();

    await request(app)
      .post('/api/posts')
      .set({ Authorization: `Bearer ${a.token}` })
      .send({ title: 'By A', content: 'body' });
    await request(app)
      .post('/api/posts')
      .set({ Authorization: `Bearer ${b.token}` })
      .send({ title: 'By B', content: 'body' });

    const res = await request(app)
      .get('/api/posts/user/me')
      .set({ Authorization: `Bearer ${a.token}` });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 1);
    assert.ok(res.body.every((p) => p.user_id === a.id));
  });

  await test('malformed JSON produces a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": broken');
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /Invalid JSON/);
  });

  await test('an unknown route returns a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.message, 'Not found');
  });
});
