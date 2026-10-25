'use client';
import { useRef, useState } from 'react';
import { budgets, projectTypes, timelines } from '../lib/inquiries';
export default function InquiryForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const requestId = useRef('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError('');
    if (!requestId.current) requestId.current = crypto.randomUUID();
    const values = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, requestId: requestId.current }),
      });
      const result = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !result.ok) throw new Error(result.error || 'Could not send your inquiry.');
      setSent(true);
      form.reset();
      requestId.current = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div className="inquiry-success" role="status">
        <span className="success-icon">✓</span>
        <h3>Inquiry received.</h3>
        <p>
          Your project details have been saved. I can review your inquiry and reply to the email you
          provided.
        </p>
        <button className="button dark" onClick={() => setSent(false)}>
          Send another inquiry ↗
        </button>
      </div>
    );
  return (
    <form className="inquiry-form" onSubmit={submit} aria-label="Project inquiry">
      <div className="inquiry-form-heading">
        <span>PROJECT INQUIRY</span>
        <h3>Tell me what you have in mind.</h3>
      </div>
      <fieldset disabled={busy}>
        <div className="form-row">
          <label htmlFor="inquiry-name">
            Your name <span>*</span>
            <input
              id="inquiry-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Your name or company"
            />
          </label>
          <label htmlFor="inquiry-email">
            Email address <span>*</span>
            <input
              id="inquiry-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@company.com"
            />
          </label>
        </div>
        <label htmlFor="inquiry-type">
          Project type
          <select id="inquiry-type" name="projectType">
            {projectTypes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label htmlFor="inquiry-budget">
            Budget range
            <select id="inquiry-budget" name="budget">
              {budgets.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label htmlFor="inquiry-timeline">
            Ideal timeline
            <select id="inquiry-timeline" name="timeline">
              {timelines.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <label htmlFor="inquiry-message">
          Project details <span>*</span>
          <textarea
            id="inquiry-message"
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={4}
            aria-describedby="message-help"
            placeholder="What would you like to build or improve? Tell me about your business and main requirements."
          />
        </label>
        <small id="message-help" className="form-help">
          At least 20 characters. Please leave out passwords or confidential information.
        </small>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button dark" type="submit">
          {busy ? 'Sending inquiry…' : 'Send project inquiry'}
          <span>↗</span>
        </button>
        <p className="form-privacy">Your details are used to review and respond to this inquiry.</p>
      </fieldset>
    </form>
  );
}
