import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
const directory = mkdtempSync(join(tmpdir(), 'riyas-setup-test-'));
const password = randomBytes(24).toString('hex');
try {
  const script = resolve('scripts/admin-setup.mjs');
  const run = spawnSync(process.execPath, [script], {
    cwd: directory,
    env: { ...process.env, PORTFOLIO_ADMIN_PASSWORD: password },
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  const text = readFileSync(join(directory, '.env.netlify'), 'utf8');
  assert.equal(text.includes('\\n'), false);
  const lines = text.trim().split('\n');
  assert.equal(lines.length, 2);
  const [salt, hash] = lines[0].slice('ADMIN_PASSWORD_HASH='.length).split(':');
  assert.equal(salt.length, 32);
  assert.equal(hash.length, 128);
  assert.equal(scryptSync(password, salt, 64).toString('hex'), hash);
  assert.match(lines[1], /^SESSION_SECRET=[A-Za-z0-9_-]{64}$/);
  assert.equal(run.stdout.includes(password), false);
  console.log(
    'PASS: setup produces separate valid secrets, password verifies, secrets are not printed. Temporary file removed.',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
