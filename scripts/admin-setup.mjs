import {randomBytes,scryptSync} from 'node:crypto';
import {writeFileSync} from 'node:fs';
// Password is supplied privately via environment; never commit either generated file.
const password=process.env.PORTFOLIO_ADMIN_PASSWORD;
if(!password||password.length<14){console.error('Set PORTFOLIO_ADMIN_PASSWORD locally to a unique password of at least 14 characters, then run npm run admin:setup. Do not send your password in chat.');process.exit(1)}
const salt=randomBytes(16).toString('hex');
const values=`ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password,salt,64).toString('hex')}\nSESSION_SECRET=${randomBytes(48).toString('base64url')}\n`;
writeFileSync('.env.netlify',values,{mode:0o600});
console.log('Created private .env.netlify. Import it to Netlify using: npx netlify-cli env:import .env.netlify. Then delete it after confirming login.');
