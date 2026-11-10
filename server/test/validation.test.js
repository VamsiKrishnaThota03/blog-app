const test = require('node:test');
const assert = require('node:assert');
const { isNonEmptyString, isValidEmail, parsePositiveInt } = require('../dist/utils/validation');
const { sslConfig } = require('../dist/config/database');
const { requireEnv } = require('../dist/config/env');

test('parsePositiveInt accepts only positive integers', () => {
  assert.strictEqual(parsePositiveInt('42'), 42);
  assert.strictEqual(parsePositiveInt('0'), null);
  assert.strictEqual(parsePositiveInt('-1'), null);
  assert.strictEqual(parsePositiveInt('1; DROP TABLE posts'), null);
  assert.strictEqual(parsePositiveInt(undefined), null);
});

test('email and string validation', () => {
  assert.ok(isValidEmail('a@b.co'));
  assert.ok(!isValidEmail('nope'));
  assert.ok(isNonEmptyString('hi', 5));
  assert.ok(!isNonEmptyString('   '));
  assert.ok(!isNonEmptyString('toolong', 3));
});

test('sslConfig verifies certificates by default and skips TLS for localhost', () => {
  delete process.env.DB_SSL;
  assert.deepStrictEqual(sslConfig('postgresql://u:p@db.example.com/x'), {
    rejectUnauthorized: true,
  });
  assert.strictEqual(sslConfig('postgresql://u:p@localhost/x'), false);
  process.env.DB_SSL = 'no-verify';
  assert.deepStrictEqual(sslConfig('postgresql://u:p@db.example.com/x'), {
    rejectUnauthorized: false,
  });
  delete process.env.DB_SSL;
});

test('requireEnv fails fast when a variable is missing', () => {
  delete process.env.SOME_MISSING_VAR;
  assert.throws(() => requireEnv('SOME_MISSING_VAR'), /SOME_MISSING_VAR/);
});
