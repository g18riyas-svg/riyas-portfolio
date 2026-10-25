import { notifyInquiry } from '../../../lib/inquiry-email';
import { getAdminUser } from '../../../lib/auth';
import { inquirySchema } from '../../../lib/inquiries';
import { store } from '../../../lib/storage';
import { listInquiries, limited, source } from '../../../lib/inquiry-store';
import { sameOrigin } from '../../../lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await getAdminUser()))
    return Response.json({ error: 'Owner access required' }, { status: 403 });
  try {
    return Response.json(
      { inquiries: await listInquiries() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Storage unavailable' }, { status: 503 });
  }
}
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return Response.json({ error: 'Please submit from this website.' }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 15000) return Response.json({ error: 'Message too large' }, { status: 413 });
  let input;
  try {
    input = inquirySchema.parse(JSON.parse(raw));
  } catch {
    return Response.json(
      { error: 'Check your details and enter a message of at least 20 characters.' },
      { status: 400 },
    );
  }
  if (input.website)
    return Response.json({ error: 'Unable to accept submission' }, { status: 400 });
  try {
    const s = store('inquiries');
    const existing = await s.get(input.requestId);
    if (existing) return Response.json({ ok: true, id: input.requestId }, { status: 201 });
    if (!(await limited('inquiry-' + source(req), 5, 30 * 60 * 1000)))
      return Response.json(
        { error: 'Too many inquiries. Please use email or WhatsApp.' },
        { status: 429, headers: { 'Retry-After': '1800' } },
      );
    const now = Date.now();
    const inquiry = {
      id: input.requestId,
      name: input.name,
      email: input.email,
      project_type: input.projectType,
      budget: input.budget,
      timeline: input.timeline,
      message: input.message,
      status: 'new' as const,
      notes: '',
      created_at: now,
      updated_at: now,
    };
    const saved = await s.setJSON(input.requestId, inquiry, { onlyIfNew: true });
    if (saved.modified) {
      try {
        await notifyInquiry(inquiry);
      } catch {
        console.error('Email notification unavailable; inquiry remains saved.');
      }
    }
    return Response.json(
      { ok: true, id: input.requestId },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Could not save. Please use email or WhatsApp.' },
      { status: 503 },
    );
  }
}
