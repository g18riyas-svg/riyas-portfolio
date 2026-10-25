import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE,
  configured,
  validPassword,
  sessionValue,
  cookieOptions,
} from '../../../../lib/auth';
import { sameOrigin, publicUrl } from '../../../../lib/site-url';
import { limited, source } from '../../../../lib/inquiry-store';

const MAX_LOGIN_BODY_BYTES = 2000;

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return new Response('Invalid origin. Open the login page on your public site URL.', {
      status: 403,
    });
  if (!configured())
    return new Response(
      'Admin login is not configured correctly. Check ADMIN_PASSWORD_HASH and SESSION_SECRET.',
      { status: 503 },
    );
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_LOGIN_BODY_BYTES)
      return new Response('Login request is too large.', { status: 413 });
    const form = new URLSearchParams(body);
    const requestedPath = form.get('returnTo');
    const returnTo = requestedPath === '/admin/inquiries' ? requestedPath : '/admin';
    const failureUrl = publicUrl('/login', request.url);
    failureUrl.searchParams.set('error', '1');
    failureUrl.searchParams.set('returnTo', returnTo);
    const allowed = await limited(`login-${source(request)}`, 10, 15 * 60 * 1000);
    if (!allowed || !validPassword(form.get('password') || ''))
      return Response.redirect(failureUrl, 303);
    (await cookies()).set(ADMIN_COOKIE, sessionValue(), cookieOptions);
    return Response.redirect(publicUrl(returnTo, request.url), 303);
  } catch {
    return new Response('Login is temporarily unavailable. Please try again.', { status: 503 });
  }
}
