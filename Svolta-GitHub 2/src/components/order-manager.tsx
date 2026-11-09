'use client';
import { useEffect, useState } from 'react';
import { Copy, Mail, RefreshCw } from 'lucide-react';
import type { Order } from '@/lib/catalog';
import { money } from '@/lib/catalog';
import settings from '@/data/checkout.json';
type Email = { subject: string; text: string };
function InvoiceEditor({ order, auth, onChange }: { order: Order; auth: Record<string, string>; onChange: (order: Order) => void }) {
  const [email, setEmail] = useState<Email | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  const editable = !['accepted', 'manual_sent', 'unknown', 'sending'].includes(order.emailStatus);
  async function action(action: string, input = {}) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/manage/orders/${encodeURIComponent(order.id)}/invoice`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...input }) });
      const body = await response.json() as { error?: string; email: Email; order: Order }; if (!response.ok) throw new Error(body.error);
      setEmail(body.email); onChange(body.order); setCopied(false);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update this request.'); }
    finally { setBusy(false); }
  }
  async function loadEmail() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/manage/orders/${encodeURIComponent(order.id)}/invoice`, { headers: auth, cache: 'no-store' });
      const body = await response.json() as { error?: string; email: Email }; if (!response.ok) throw new Error(body.error); setEmail(body.email);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to load the invoice.'); } finally { setBusy(false); }
  }
  return <div className="invoice-editor"><h3>Review &amp; prepare invoice</h3><p>Confirm supplier availability, delivery eligibility, shipping, and applicable tax before sending. This screen never marks an order paid.</p>
    {editable && <form className="commerce-form" onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      const parse = (name: string) => { const value = String(form.get(name)); if (!/^\d+(\.\d{1,2})?$/.test(value)) return NaN; return Math.round(Number(value) * 100); };
      const shippingCents = parse('shipping'); const taxCents = parse('tax');
      if (!Number.isSafeInteger(shippingCents) || !Number.isSafeInteger(taxCents)) { setError('Enter shipping and tax in dollars, with up to two decimal places.'); return; }
      void action('prepare', { shippingCents, taxCents, availabilityConfirmed: form.get('availability') === 'on', chargesConfirmed: form.get('charges') === 'on' });
    }}><div className="request-field-grid"><label>Final shipping (USD)<input name="shipping" inputMode="decimal" required placeholder="0.00" defaultValue={order.invoice ? (order.invoice.shippingCents / 100).toFixed(2) : ''} /></label><label>Final tax (USD)<input name="tax" inputMode="decimal" required placeholder="0.00" defaultValue={order.invoice ? (order.invoice.taxCents / 100).toFixed(2) : ''} /></label></div><label className="check"><input type="checkbox" name="availability" required /><span>I have confirmed item availability and delivery eligibility.</span></label><label className="check"><input type="checkbox" name="charges" required /><span>I have reviewed the final charges, including applicable tax.</span></label><button className="button" disabled={busy}>Prepare invoice preview</button></form>}
    {order.invoice && <div className="invoice-ready"><p><strong>{order.invoice.number}</strong><br />Final invoice amount: <strong>{money(order.invoice.totalCents)}</strong></p><button className="button outline" disabled={busy} onClick={loadEmail}>View prepared email</button></div>}
    {email && <div className="invoice-email-preview"><p><strong>From:</strong> {order.invoice?.senderEmail ?? settings.senderEmail}<br /><strong>To:</strong> {order.customer.email}</p><label>Invoice email<textarea aria-label="Prepared invoice email" readOnly value={`Subject: ${email.subject}\n\n${email.text}`} rows={18} /></label><div className="account-links"><button className="button" onClick={async () => { try { await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.text}`); setCopied(true); } catch { setError('Select and copy the email text above.'); } }}><Copy size={15} /> {copied ? 'Copied' : 'Copy invoice email'}</button>{editable && <button className="button outline" disabled={busy} onClick={() => { if (window.confirm('Have you sent this exact invoice to the customer from your business mailbox? This records the manual send and leaves the request unpaid.')) void action('manual_sent'); }}>I sent this invoice manually</button>}</div><p className="request-fineprint">Automatic email sending is deferred. Copy the reviewed invoice into your business mailbox. Only record a manual send after actually sending it.</p></div>}
    {error && <p className="request-error" role="alert">{error}</p>}
  </div>;
}
export function OrderManager() {
  const [analytics, setAnalytics] = useState<{ path: string; event: string; total: number }[]>([]);
  const [key, setKey] = useState(''); const [activeKey, setActiveKey] = useState(''); const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(true); const [authorized, setAuthorized] = useState(false); const [cursor, setCursor] = useState<string | null>(null);
  const auth: Record<string, string> = activeKey ? { Authorization: `Bearer ${activeKey}` } : {};
  async function load(before?: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/manage/orders${before ? `?before=${encodeURIComponent(before)}` : ''}`, { headers: auth, cache: 'no-store' });
      const body = await response.json() as { error?: string; orders: Order[]; nextCursor: string | null; analytics?: { path: string; event: string; total: number }[] }; if (!response.ok) throw new Error(body.error);
      setAnalytics(body.analytics ?? []);
      setOrders(previous => before ? [...previous, ...body.orders] : body.orders); setCursor(body.nextCursor); setAuthorized(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to load requests.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, [activeKey]); // Credentials remain only in this tab's memory.
  return <div className="request-page order-management"><span className="eyebrow">PRIVATE / OWNER WORKSPACE</span><div className="manage-heading"><div><h1>Order requests.</h1><p>Review saved requests and prepare an invoice for separate payment.</p></div><button className="button outline" disabled={busy} onClick={() => void load()}><RefreshCw size={16} /> Refresh</button></div><div className="request-notice"><Mail size={20} /><p>Invoices: <strong>{settings.senderEmail}</strong> · Venmo: <strong>@{settings.venmoHandle}</strong> / {settings.venmoRecipientName}<br />Automatic email sending is deferred. Sender and recipient details are editable in Codex.</p></div>
    {!authorized && !busy && <form className="commerce-form manager-auth" onSubmit={e => { e.preventDefault(); setActiveKey(key); setKey(''); }}><p>On Sites, sign in as the owner. For Vercel or local previews, use the management key configured in your hosting environment.</p><label>Management key<input type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" required /></label><button className="button">Open order workspace</button><a href="/signin-with-chatgpt?return_to=/manage/orders" target="_top">Sign in with ChatGPT on Sites ↗</a></form>}
    {error && <p role="alert" className="request-error">{error}</p>}{busy && <p role="status">Loading requests…</p>}
    {authorized && <section className="analytics-summary"><h2>Aggregate analytics.</h2><p>Last 30 days · opt-in counts, not unique visitors. No visitor IDs, query strings or customer details are stored in these counters.</p>{analytics.length ? <div className="analytics-table"><table><caption>Opt-in page views and actions</caption><thead><tr><th scope="col">Page</th><th scope="col">Event</th><th scope="col">Count</th></tr></thead><tbody>{analytics.map(row => <tr key={`${row.path}:${row.event}`}><td>{row.path}</td><td>{row.event.replaceAll('_', ' ')}</td><td>{row.total}</td></tr>)}</tbody></table></div> : <p>No opted-in activity has been recorded yet.</p>}</section>}
    {authorized && !orders.length && !busy && <div className="request-empty"><h2>No order requests yet.</h2><p>Saved checkout requests will appear here.</p></div>}
    {orders.map(order => <article key={order.id} className="managed-order"><div className="managed-order-heading"><div><h2 className="order-id">{order.id}</h2><p>{new Date(order.createdAt).toLocaleString()} · {order.customer.fullName}</p></div><span className="unpaid-badge">UNPAID · {order.status.replaceAll('_', ' ').toUpperCase()}</span></div><div className="managed-order-details"><div><h3>Customer &amp; delivery</h3><address>{order.customer.fullName}<br /><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><br />{order.customer.address1}<br />{order.customer.address2 && <>{order.customer.address2}<br /></>}{[order.customer.city, order.customer.region, order.customer.postalCode].filter(Boolean).join(', ')}<br />{order.customer.country}</address></div><div><h3>Requested items</h3>{order.items.map(item => <p key={item.productId}>{item.name} · {item.massMg} mg × {item.quantity}<br /><strong>{money(item.unitPriceCents * item.quantity)}</strong></p>)}<p>Estimated subtotal: <strong>{money(order.estimatedSubtotalCents)}</strong></p><p>Email status: {order.emailStatus.replaceAll('_', ' ')}</p></div></div><details><summary>Review invoice &amp; payment instructions <span>+</span></summary><InvoiceEditor order={order} auth={auth} onChange={updated => setOrders(orders => orders.map(o => o.id === updated.id ? updated : o))} /></details></article>)}
    {cursor && <button className="button outline" disabled={busy} onClick={() => void load(cursor)}>Load older requests</button>}
  </div>;
}
