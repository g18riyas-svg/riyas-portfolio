import { store, limited } from './storage';
import type { Inquiry } from './inquiries';
import { createHash } from 'node:crypto';
export function source(req: Request) {
  return createHash('sha256')
    .update(req.headers.get('x-nf-client-connection-ip') || 'unknown')
    .digest('hex');
}
export async function listInquiries() {
  const s = store('inquiries');
  const { blobs } = await s.list();
  const items = await Promise.all(
    blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<Inquiry | null>),
  );
  return items
    .filter((x): x is Inquiry => Boolean(x))
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 500);
}
export { limited };
