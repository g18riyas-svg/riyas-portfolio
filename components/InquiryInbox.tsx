'use client';
import { useState } from 'react';
import type { Inquiry } from '../lib/inquiries';
import AdminNav from './AdminNav';
const statusLabel = { new: 'New', contacted: 'Contacted', closed: 'Closed' };
function date(value: number) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo',
  }).format(new Date(value));
}
export default function InquiryInbox({
  initial,
  loadError,
}: {
  initial: Inquiry[];
  loadError: string;
}) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState(initial[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState(initial[0]?.notes || '');
  const [status, setStatus] = useState<Inquiry['status']>(initial[0]?.status || 'new');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(loadError);
  const item = items.find((x) => x.id === selected);
  const dirty = !!item && (notes !== item.notes || status !== item.status);
  const visible = items.filter(
    (x) =>
      (filter === 'all' || x.status === filter) &&
      `${x.name} ${x.email} ${x.message} ${x.project_type}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function select(x: Inquiry) {
    if (dirty && !confirm('Discard unsaved changes to this inquiry?')) return;
    setSelected(x.id);
    setNotes(x.notes);
    setStatus(x.status);
    setNotice('');
  }
  async function save() {
    if (!item) return;
    setBusy(true);
    setNotice('');
    try {
      const r = await fetch('/api/inquiries/' + item.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, status }),
      });
      const result = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(result.error);
      setItems(
        items.map((x) => (x.id === item.id ? { ...x, notes, status, updated_at: Date.now() } : x)),
      );
      setNotice('Inquiry updated.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (dirty && !confirm('Discard unsaved changes and refresh?')) return;
    setBusy(true);
    try {
      const r = await fetch('/api/inquiries');
      const j = (await r.json()) as { inquiries: Inquiry[]; error?: string };
      if (!r.ok) throw Error(j.error);
      setItems(j.inquiries);
      const next = j.inquiries.find((x) => x.id === selected) || j.inquiries[0];
      setSelected(next?.id || '');
      setNotes(next?.notes || '');
      setStatus(next?.status || 'new');
      setNotice('Inbox refreshed.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not refresh.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-shell">
      <a className="underlink" href="/">
        ← View portfolio
      </a>
      <AdminNav active="inquiries" />
      <header className="inbox-header">
        <div>
          <div className="eyebrow">YOUR PROJECT PIPELINE</div>
          <h1>
            Inquiries<span>.</span>
          </h1>
          <p>Read project requests, keep notes, and track your next conversation.</p>
        </div>
        <button className="small-button" disabled={busy} onClick={refresh}>
          ↻ Refresh inbox
        </button>
      </header>
      <div className="inbox-stats">
        {(['new', 'contacted', 'closed'] as const).map((s) => (
          <div key={s}>
            <span>{statusLabel[s]}</span>
            <b>{items.filter((x) => x.status === s).length}</b>
          </div>
        ))}
      </div>
      <div className="inbox-toolbar">
        <label>
          Search inquiries
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or project…"
          />
        </label>
        <label>
          Status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All inquiries</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>
      {notice && (
        <p className="save-status" role="status">
          {notice}
        </p>
      )}
      <div className="inbox-grid">
        <aside className="inquiry-list" aria-label="Inquiry list">
          {visible.length ? (
            visible.map((x) => (
              <button
                className={'inquiry-item ' + (x.id === selected ? 'selected' : '')}
                key={x.id}
                onClick={() => select(x)}
              >
                <div>
                  <b>{x.name}</b>
                  <span className={'inquiry-badge ' + x.status}>{statusLabel[x.status]}</span>
                </div>
                <span>{x.project_type}</span>
                <small>{date(x.created_at)} · Sri Lanka time</small>
                <p>
                  {x.message.slice(0, 110)}
                  {x.message.length > 110 ? '…' : ''}
                </p>
              </button>
            ))
          ) : (
            <div className="inbox-empty">
              <h2>{items.length ? 'No matching inquiries.' : 'Your next project starts here.'}</h2>
              <p>
                {items.length
                  ? 'Try a different search or status.'
                  : 'New form submissions will appear here. Use Refresh inbox to check for new messages.'}
              </p>
            </div>
          )}
        </aside>
        {item ? (
          <article className="inquiry-detail">
            <div className="inquiry-detail-top">
              <div>
                <span className={'inquiry-badge ' + item.status}>{statusLabel[item.status]}</span>
                <h2>{item.name}</h2>
                <a className="underlink" href={'mailto:' + item.email}>
                  {item.email}
                </a>
              </div>
              <span className="inquiry-date">
                {date(item.created_at)}
                <br />
                Sri Lanka time
              </span>
            </div>
            <dl className="inquiry-facts">
              <div>
                <dt>Project type</dt>
                <dd>{item.project_type}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{item.budget}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{item.timeline}</dd>
              </div>
            </dl>
            <h3>Project details</h3>
            <p className="inquiry-message">{item.message}</p>
            <a
              className="button"
              href={
                'mailto:' +
                item.email +
                '?subject=' +
                encodeURIComponent('Your project inquiry — ' + item.project_type)
              }
            >
              Reply by email <span>↗</span>
            </a>
            <p className="field-help">
              Opens your email app. Mark the inquiry Contacted after replying.
            </p>
            <fieldset className="inquiry-edit" disabled={busy}>
              <label>
                Inquiry status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Inquiry['status'])}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label>
                Private notes
                <textarea
                  rows={5}
                  maxLength={5000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Call notes, requirements, and next steps…"
                />
              </label>
              <button className="button" disabled={!dirty || busy} onClick={save}>
                {busy ? 'Saving…' : 'Save inquiry changes ↗'}
              </button>
            </fieldset>
          </article>
        ) : (
          <div className="inquiry-detail">
            <h2>No inquiry selected.</h2>
            <p>Project inquiries are visible only to your signed-in owner account.</p>
          </div>
        )}
      </div>
      <p className="field-help">
        Showing up to the 500 most recent inquiries. No automatic email notifications are
        configured.
      </p>
    </main>
  );
}
