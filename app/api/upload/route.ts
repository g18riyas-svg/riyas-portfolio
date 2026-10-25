import { sameOrigin } from '../../../lib/auth';
import { bucket } from '../../../lib/storage';
import { getAdminUser } from '../../../lib/auth';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  if (!(await getAdminUser()))
    return Response.json({ error: 'Owner access required' }, { status: 403 });
  if (!sameOrigin(req)) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  if (!bucket) return Response.json({ error: 'Storage unavailable' }, { status: 503 });
  if (Number(req.headers.get('content-length') || 0) > 4200000)
    return Response.json({ error: 'Maximum file size is 3 MB' }, { status: 413 });
  const f = (await req.formData()).get('file');
  if (!(f instanceof File) || f.size > 3 * 1024 * 1024)
    return Response.json({ error: 'Choose a PNG, JPEG or WebP under 3 MB' }, { status: 400 });
  const b = await f.arrayBuffer();
  const a = new Uint8Array(b);
  let ext = '',
    type = '';
  if (a[0] === 137 && a[1] === 80 && a[2] === 78 && a[3] === 71) {
    ext = 'png';
    type = 'image/png';
  } else if (a[0] === 255 && a[1] === 216 && a[2] === 255) {
    ext = 'jpg';
    type = 'image/jpeg';
  } else if (
    String.fromCharCode(...a.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...a.slice(8, 12)) === 'WEBP'
  ) {
    ext = 'webp';
    type = 'image/webp';
  }
  if (!ext)
    return Response.json({ error: 'Only PNG, JPEG and WebP images are accepted' }, { status: 400 });
  const key = crypto.randomUUID() + '.' + ext;
  await bucket.put('images/' + key, b, { httpMetadata: { contentType: type } });
  return Response.json({ url: '/media/' + key });
}
