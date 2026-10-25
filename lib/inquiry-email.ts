import nodemailer from 'nodemailer';
import { store } from './storage';
import type { Inquiry } from './inquiries';

export type Delivery = { status: 'sending' | 'sent' | 'failed'; updatedAt: number };
export function emailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
export function emailMessage(inquiry: Inquiry) {
  const user = process.env.GMAIL_USER!;
  return {
    from: { name: 'Riyas Portfolio', address: user },
    to: 'g.18.riyas@gmail.com',
    replyTo: { name: inquiry.name, address: inquiry.email },
    subject: 'New portfolio inquiry — ' + inquiry.project_type,
    messageId: `<portfolio-${inquiry.id}@${user.split('@')[1]}>`,
    text: [
      `New inquiry from ${inquiry.name}`,
      `Email: ${inquiry.email}`,
      `Project: ${inquiry.project_type}`,
      `Budget: ${inquiry.budget}`,
      `Timeline: ${inquiry.timeline}`,
      '',
      inquiry.message,
      '',
      `Inquiry ID: ${inquiry.id}`,
      'Manage this inquiry in your portfolio admin inbox.',
    ].join('\n'),
  };
}
export async function sendInquiryEmail(inquiry: Inquiry) {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail(emailMessage(inquiry));
    if (!result.accepted.length) throw new Error('Delivery rejected');
  } finally {
    transport.close();
  }
}
// A lease prevents simultaneous submissions/retries sending the same notification.
// Inquiry data has already been saved before this function is called.
export async function notifyInquiry(inquiry: Inquiry, send = sendInquiryEmail) {
  if (!emailConfigured()) return;
  const s = store('notifications');
  const old = await s.getWithMetadata(inquiry.id, { type: 'json' });
  const previous = old?.data as Delivery | undefined;
  if (
    previous?.status === 'sent' ||
    (previous?.status === 'sending' && Date.now() - previous.updatedAt < 5 * 60 * 1000)
  )
    return;
  const claimed = await s.setJSON(
    inquiry.id,
    { status: 'sending', updatedAt: Date.now() },
    old ? { onlyIfMatch: old.etag } : { onlyIfNew: true },
  );
  if (!claimed.modified) return;
  let status: Delivery['status'] = 'sent';
  try {
    await send(inquiry);
  } catch {
    status = 'failed';
    console.error('Portfolio email notification failed; inquiry remains saved.');
  }
  await s.setJSON(inquiry.id, { status, updatedAt: Date.now() });
}
