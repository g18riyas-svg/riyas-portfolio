import { cookies } from 'next/headers';
import { createHmac, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
export { sameOrigin } from './site-url';

export const ADMIN_COOKIE = 'riyas_admin';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const ADMIN_EMAIL = 'g.18.riyas@gmail.com';

function passwordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH || '';
}

export function configured(): boolean {
  const validHash = /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(passwordHash());
  return validHash && (process.env.SESSION_SECRET?.length || 0) >= 32;
}

export function validPassword(password: string): boolean {
  if (!configured() || password.length < 14 || password.length > 256) return false;
  try {
    const [salt, storedHash] = passwordHash().split(':');
    const expected = Buffer.from(storedHash, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function signSession(payload: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET!).update(payload).digest('base64url');
}

function passwordVersion(): string {
  return createHash('sha256').update(passwordHash()).digest('hex');
}

export function sessionValue(): string {
  if (!configured()) throw new Error('Admin login is not configured.');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + SESSION_DURATION_MS,
      v: passwordVersion(),
    }),
  ).toString('base64url');
  return `${payload}.${signSession(payload)}`;
}

export async function getAdminUser(): Promise<{ email: string } | null> {
  if (!configured()) return null;
  try {
    const value = (await cookies()).get(ADMIN_COOKIE)?.value || '';
    const parts = value.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const supplied = Buffer.from(signature);
    const expected = Buffer.from(signSession(payload));
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (
      !Number.isFinite(session.exp) ||
      session.exp <= Date.now() ||
      session.v !== passwordVersion()
    )
      return null;
    return { email: ADMIN_EMAIL };
  } catch {
    return null;
  }
}

export async function requireAdminUser(path: string) {
  const user = await getAdminUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(path)}`);
  return user;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_DURATION_MS / 1000,
};
