import { randomBytes, scryptSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// The caller enters a password privately in their local terminal.
const password = process.env.PORTFOLIO_ADMIN_PASSWORD;
if (!password || password.length < 14 || password.length > 256) {
  console.error(
    'Choose a unique admin password of 14–256 characters using PORTFOLIO_ADMIN_PASSWORD, then run npm run admin:setup.',
  );
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const secret = randomBytes(48).toString('base64url');
const environmentFile = [
  `ADMIN_PASSWORD_HASH=${salt}:${hash}`,
  `SESSION_SECRET=${secret}`,
  '',
].join('\n');

writeFileSync('.env.netlify', environmentFile, { mode: 0o600 });
console.log(
  'Created .env.netlify with two separate variables. Copy each value privately into Netlify and redeploy. Never commit this file.',
);
