import assert from 'node:assert/strict';
import { sameOrigin, publicUrl } from '../lib/site-url';

const previous = { ...process.env };
try {
  process.env.SITE_URL = 'https://risme-riyas-portfolio.netlify.app';
  delete process.env.DEPLOY_URL;
  delete process.env.DEPLOY_PRIME_URL;
  const internalUrl = 'http://localhost:3000/api/auth/login';
  const request = (origin?: string) =>
    new Request(internalUrl, { headers: origin ? { origin } : {} });
  assert.equal(sameOrigin(request(process.env.SITE_URL)), true);
  for (const origin of [
    undefined,
    'null',
    'https://evil.example',
    process.env.SITE_URL + '.evil.example',
  ])
    assert.equal(sameOrigin(request(origin)), false);
  assert.equal(publicUrl('/admin', internalUrl).href, process.env.SITE_URL + '/admin');
  assert.equal(
    publicUrl('/login?error=1', 'https://main--risme-riyas-portfolio.netlify.app/api/auth/login')
      .hostname,
    'risme-riyas-portfolio.netlify.app',
  );
  assert.throws(() => publicUrl('//evil.example', internalUrl));
  process.env.DEPLOY_PRIME_URL = 'https://main--risme-riyas-portfolio.netlify.app';
  assert.equal(sameOrigin(request(process.env.DEPLOY_PRIME_URL)), true);
  const spoofed = new Request(internalUrl, {
    headers: { origin: 'https://evil.example', 'x-forwarded-host': 'evil.example' },
  });
  assert.equal(sameOrigin(spoofed), false);
  console.log(
    'PASS: canonical login redirects, internal proxy URL, trusted deployment alias, foreign origin, missing origin, lookalike domain and spoofed host.',
  );
} finally {
  for (const key of ['SITE_URL', 'DEPLOY_URL', 'DEPLOY_PRIME_URL']) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}
