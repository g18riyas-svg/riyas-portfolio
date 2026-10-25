import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '../../../../lib/auth';
import { sameOrigin, publicUrl } from '../../../../lib/site-url';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Invalid origin.', { status: 403 });
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.redirect(publicUrl('/', request.url), 303);
}
