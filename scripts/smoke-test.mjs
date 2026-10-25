import { BlobsServer } from '@netlify/blobs/server';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
process.env.NO_PROXY = 'localhost,127.0.0.1';
process.env.no_proxy = 'localhost,127.0.0.1';
process.env.NODE_USE_ENV_PROXY = '0';
const directory = await mkdtemp(join(tmpdir(), 'riyas-test-'));
const blobs = new BlobsServer({ directory, token: 'test-token' });
const addr = await blobs.start();
const password = randomBytes(20).toString('hex');
const salt = '0123456789abcdef0123456789abcdef';
const base = 'http://localhost:3119';
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-p', '3119', '-H', '127.0.0.1'],
  {
    env: {
      ...process.env,
      GMAIL_USER: '',
      GMAIL_APP_PASSWORD: '',
      SITE_URL: base,
      NODE_OPTIONS: '--dns-result-order=ipv4first',
      ADMIN_PASSWORD_HASH: salt + ':' + scryptSync(password, salt, 64).toString('hex'),
      SESSION_SECRET: randomBytes(48).toString('hex'),
      NETLIFY_BLOBS_CONTEXT: Buffer.from(
        JSON.stringify({
          siteID: 'test-site',
          token: 'test-token',
          apiURL: `http://127.0.0.1:${addr.port}`,
          edgeURL: `http://127.0.0.1:${addr.port}`,
          uncachedEdgeURL: `http://127.0.0.1:${addr.port}`,
        }),
      ).toString('base64'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
child.stdout.on('data', (d) => {
  logs += d;
  process.stdout.write(d);
});
child.stderr.on('data', (d) => {
  logs += d;
  process.stderr.write(d);
});
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + '/login', { signal: AbortSignal.timeout(2000) })).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  const req = (path, options = {}) => (
    console.log('Checking', path),
    fetch(base + path, {
      ...options,
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: { origin: base, ...options.headers },
    })
  );
  let r = await req('/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Risme Mohomad Riyas/);
  assert.equal((await req('/admin')).status, 307);
  assert.equal((await req('/api/inquiries')).status, 403);
  assert.equal((await req('/api/notifications')).status, 403);
  r = await req('/api/auth/login', {
    method: 'POST',
    body: new URLSearchParams({ password: 'wrong' }),
  });
  assert.equal(r.status, 303);
  assert.match(r.headers.get('location'), /error/);
  assert.equal(new URL(r.headers.get('location')).origin, base);
  r = await req('/api/auth/login', { method: 'POST', body: new URLSearchParams({ password }) });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), base + '/admin');
  const cookie = r.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /riyas_admin=/);
  const auth = { cookie };
  assert.equal(
    (await (await req('/api/notifications', { headers: auth })).json()).configured,
    false,
  );
  r = await req('/admin', { headers: auth });
  assert.equal(r.status, 200);
  const portfolio = (await (await req('/api/portfolio', { headers: auth })).json()).data;
  assert.equal(portfolio.projects.length, 4);
  r = await req('/api/portfolio', {
    method: 'PUT',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify(portfolio),
  });
  assert.equal(r.status, 200);
  const id = crypto.randomUUID();
  const input = {
    requestId: id,
    name: 'Smoke Test',
    email: 'test@example.com',
    projectType: 'Web application',
    budget: 'Prefer to discuss',
    timeline: 'Flexible / exploring',
    message: 'This is a temporary test inquiry for migration verification.',
    website: '',
  };
  for (let i = 0; i < 2; i++) {
    r = await req('/api/inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    assert.equal(r.status, 201);
  }
  let inbox = await (await req('/api/inquiries', { headers: auth })).json();
  assert.equal(inbox.inquiries.length, 1);
  assert.equal((await req('/api/notifications', { method: 'POST', headers: auth })).status, 503);
  r = await req('/api/inquiries/' + id, {
    method: 'PATCH',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'contacted', notes: 'Test note' }),
  });
  assert.equal(r.status, 200);
  inbox = await (await req('/api/inquiries', { headers: auth })).json();
  assert.equal(inbox.inquiries[0].status, 'contacted');
  const form = new FormData();
  form.set(
    'file',
    new Blob(
      [
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=',
          'base64',
        ),
      ],
      { type: 'image/png' },
    ),
    'test.png',
  );
  r = await req('/api/upload', { method: 'POST', headers: auth, body: form });
  assert.equal(r.status, 200);
  const media = await r.json();
  assert.equal((await req(media.url)).status, 200);
  assert.equal(
    (
      await req('/api/portfolio', {
        method: 'PUT',
        headers: { ...auth, origin: 'https://wrong.example' },
        body: '{}',
      })
    ).status,
    403,
  );
  r = await req('/api/auth/logout', { method: 'POST', headers: auth });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), base + '/');
  console.log(
    'PASS: homepage, admin protection, password login, portfolio save, duplicate inquiry, inbox update, image upload/read, origin protection, logout. Test data removed.',
  );
} catch (e) {
  console.error(logs);
  throw e;
} finally {
  child.kill();
  await blobs.stop();
  await rm(directory, { recursive: true, force: true });
}
