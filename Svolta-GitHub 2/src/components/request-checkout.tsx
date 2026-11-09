'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, CreditCard, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useCart } from './cart-provider';
import { money } from '@/lib/catalog';
import settings from '@/data/checkout.json';
import type { Order } from '@/lib/catalog';

function Progress({ step }: { step: number }) {
  return <ol className="checkout-progress" aria-label="Order progress">{['Your cart', 'Your details', 'Request received'].map((label, index) => <li key={label} className={index + 1 <= step ? 'active' : ''} aria-current={index + 1 === step ? 'step' : undefined}><span>{index + 1 < step ? <Check size={13} /> : `0${index + 1}`}</span>{label}</li>)}</ol>;
}
function EmptyCart() {
  return <div className="request-empty"><span className="eyebrow">A PLACE TO START</span><h2>Your cart is empty.</h2><p>Explore the catalog and add compounds to an order request.</p><a href="/compounds/" className="button">Explore compounds <ArrowRight size={17} /></a></div>;
}
function Summary({ action }: { action?: React.ReactNode }) {
  const { items, products } = useCart();
  const lines = items.flatMap(item => { const product = products.find(p => p.id === item.productId); return product ? [{ ...item, product }] : []; });
  return <aside className="order-summary request-summary"><span className="eyebrow">YOUR REQUEST</span><h2>Order summary</h2>
    {lines.map(({ product, quantity }) => <div className="summary-line" key={product.id}><div>{product.name}<small>{product.massMg} mg · Quantity {quantity}</small></div><b>{money(product.priceCents * quantity)}</b></div>)}
    <dl><div className="summary-total"><dt>Estimated subtotal</dt><dd>{money(lines.reduce((n, i) => n + i.product.priceCents * i.quantity, 0))}</dd></div><div><dt>Shipping &amp; tax</dt><dd>On your invoice</dd></div><div><dt>Payment collected today</dt><dd>{money(0)}</dd></div></dl>
    <p className="request-fineprint">Catalog prices are provisional. Your invoice confirms availability, shipping, tax, and the final amount. No stock is reserved by this request.</p>{action}
    <div className="payment-caption"><CreditCard size={17} /><span>Payment is handled separately.<br />No card details are requested.</span></div>
  </aside>;
}
export function CartPage() {
  const cart = useCart();
  return <div className="request-page"><Progress step={1} /><div className="request-heading"><span className="eyebrow">RESEARCH, CONSIDERED.</span><h1>Your cart.</h1><p>Review your compounds. Request an invoice. Pay separately.</p></div>
    {!cart.ready ? <p role="status">Loading your cart…</p> : !cart.items.length ? <EmptyCart /> : <div className="checkout-layout"><div>
      <div className="request-notice"><ShieldCheck size={20} /><p>For laboratory research only. All items are subject to availability and documentation review.</p></div>
      {cart.items.map(item => { const p = cart.products.find(p => p.id === item.productId); return p && <article className="cart-line request-cart-line" key={p.id}><div className="cart-monogram" aria-hidden="true">SV<span>/</span></div><div className="cart-description"><span className="eyebrow">RESEARCH COMPOUND</span><h2><a href={`/compounds/${p.id}/`}>{p.name}</a></h2><p>{p.massMg} mg · {money(p.priceCents)} / unit</p><div className="cart-controls"><label>Quantity<input type="number" aria-label={`Quantity for ${p.name}`} min={1} max={20} value={item.quantity} onChange={e => cart.setQuantity(p.id, Number(e.target.value))} /></label><button className="text-button remove-item" onClick={() => cart.setQuantity(p.id, 0)} aria-label={`Remove ${p.name}`}><Trash2 size={15} /> Remove</button></div></div><b>{money(p.priceCents * item.quantity)}</b></article>; })}
      <a href="/compounds/" className="link-arrow">← Continue exploring</a>
    </div><Summary action={<a className="button full" href="/checkout/">Continue to checkout <ArrowRight size={17} /></a>} /></div>}
  </div>;
}
const SESSION_KEY = 'svolta-pending-request-key';
export function CheckoutPage() {
  const cart = useCart();
  const [ready, setReady] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setReady(false);
    fetch('/api/order-session', { cache: 'no-store' }).then(async response => { const body = await response.json() as { error?: string }; if (!response.ok) throw new Error(body.error); if (active) { setReady(true); setError(''); } }).catch(error => { if (active) setError(error.message || 'Unable to connect to checkout. Please retry.'); });
    return () => { active = false; };
  }, [retry]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving || !ready) return;
    setSaving(true); setError(''); const form = new FormData(event.currentTarget);
    try {
      let idempotencyKey = sessionStorage.getItem(SESSION_KEY);
      if (!idempotencyKey) { idempotencyKey = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, idempotencyKey); }
      const customer = Object.fromEntries(['fullName', 'email', 'address1', 'address2', 'city', 'region', 'postalCode', 'country'].map(key => [key, String(form.get(key) ?? '')]));
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey, customer, items: cart.items, ageConfirmed: form.get('age') === 'on', researchConfirmed: form.get('research') === 'on', invoiceConfirmed: form.get('invoice') === 'on', website: form.get('website') ?? '' }) });
      const body = await response.json() as { error?: string; order: Order }; if (!response.ok) throw new Error(body.error || 'Unable to save your request.');
      sessionStorage.removeItem(SESSION_KEY); cart.clear();
      window.dispatchEvent(new Event('svolta-request-saved'));
      window.location.assign(`/checkout/complete/?order=${encodeURIComponent(body.order.id)}`);
    } catch (error) { setError(error instanceof Error ? error.message : 'We could not confirm your request. Please retry using the same details.'); setSaving(false); }
  }
  return <div className="request-page"><Progress step={2} /><div className="request-heading"><span className="eyebrow">ONE STEP CLOSER</span><h1>Checkout.</h1><p>Submit your details. We’ll review your request and email your invoice.</p></div>
    {!cart.ready ? <p role="status">Loading your cart…</p> : !cart.items.length ? <EmptyCart /> : <div className="checkout-layout"><div>
      <form className="commerce-form request-form" onSubmit={submit}>
        <fieldset disabled={saving}><legend><span>01</span> Contact information</legend><div className="request-field-grid">
          <label className="span-two">Full name<input name="fullName" autoComplete="name" maxLength={120} required /></label>
          <label className="span-two">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /><small>Your invoice and order updates will go here.</small></label>
        </div></fieldset>
        <fieldset disabled={saving}><legend><span>02</span> Shipping address</legend><div className="request-field-grid">
          <label className="span-two">Street address<input name="address1" autoComplete="address-line1" maxLength={160} required /></label>
          <label className="span-two">Apartment, suite, etc. <span className="optional">(optional)</span><input name="address2" autoComplete="address-line2" maxLength={160} /></label>
          <label>City<input name="city" autoComplete="address-level2" maxLength={100} required /></label>
          <label>State / province / region<input name="region" autoComplete="address-level1" maxLength={160} /></label>
          <label>Postal code<input name="postalCode" autoComplete="postal-code" maxLength={160} /></label>
          <label>Country<input name="country" autoComplete="country-name" maxLength={80} required /></label>
        </div><p className="request-fineprint">We review availability and delivery eligibility before invoicing. Shipping charges are confirmed on the invoice.</p></fieldset>
        <fieldset className="request-agreements" disabled={saving}><legend><span>03</span> Review &amp; confirm</legend>
          <label className="check"><input type="checkbox" name="age" required /><span>I confirm that I am 21 years of age or older.</span></label>
          <label className="check"><input type="checkbox" name="research" required /><span>I acknowledge that these materials are for laboratory research only and are not for human or veterinary use.</span></label>
          <label className="check"><input type="checkbox" name="invoice" required /><span>I understand that this submits an unpaid order request, subject to review. I will wait for the invoice and pay separately through Venmo.</span></label>
        </fieldset>
        <div className="request-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <p className="request-fineprint">We save your name, email, and shipping address to review and fulfill your request. Your cart stays in this browser; your contact and address details are stored on the server. <a href="/privacy/">Privacy details</a></p>
        {error && <div className="request-error" role="alert"><p>{error}</p>{!ready && <button type="button" className="text-button" onClick={() => setRetry(n => n + 1)}>Reconnect to checkout</button>}<a href={`mailto:${settings.supportEmail}`}>Contact Svolta ↗</a></div>}
        <button className="button full complete-order" disabled={!ready || saving}>{saving ? 'Saving your request…' : !ready ? 'Connecting to checkout…' : 'Complete Order'}<ArrowRight size={18} /></button>
        <p className="complete-caption">No payment is collected when you complete this order request.</p>
      </form>
    </div><Summary /></div>}
  </div>;
}
export function OrderComplete() {
  const params = useSearchParams(); const id = params.get('order');
  const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    if (!id) { setError('No order reference was supplied.'); return; }
    let active = true;
    fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: 'no-store' }).then(async response => { const body = await response.json() as { error?: string; order: Order }; if (!response.ok) throw new Error(body.error); if (active) setOrder(body.order); }).catch(error => { if (active) setError(error.message || 'Unable to load your request.'); });
    return () => { active = false; };
  }, [id]);
  return <div className="request-page complete-page"><Progress step={3} />{error ? <div className="request-empty"><h1>Let’s find your request.</h1><p role="alert">{error}</p><a className="button" href={`mailto:${settings.supportEmail}`}>Contact Svolta</a></div> : !order ? <p role="status">Loading your saved request…</p> : <>
    <div className="confirmation-heading"><span className="confirmation-check"><CheckCircle2 size={33} /></span><span className="eyebrow">THANK YOU, {order.customer.fullName.split(' ')[0].toUpperCase()}</span><h1>Request received.</h1><p>Order <strong className="order-id">{order.id}</strong> has been saved.<br />No payment has been collected.</p><span className="unpaid-badge">UNPAID · {order.status === 'awaiting_payment' ? 'AWAITING PAYMENT' : 'AWAITING INVOICE'}</span></div>
    <div className="confirmation-layout"><section className="next-steps"><div className="next-steps-heading"><span className="eyebrow">WHAT HAPPENS NEXT</span><h2>A clear path forward.</h2></div><ol className="invoice-steps">
      <li><span className="step-number">01</span><div><Mail size={22} /><h3>Watch your inbox</h3><p>After reviewing your request, we’ll email an itemized invoice to <strong>{order.customer.email}</strong> from <strong>{order.invoice?.senderEmail ?? settings.senderEmail}</strong>. It will confirm availability and the final amount, including shipping and tax.</p><p>Until then, please wait to pay. Check spam or junk if you’re expecting an invoice.</p></div></li>
      <li><span className="step-number">02</span><div><CreditCard size={22} /><h3>Pay separately with Venmo</h3><p>Follow the instructions in your invoice. Verify <strong>@{order.invoice?.payment.handle ?? settings.venmoHandle}</strong> and the displayed name <strong>{order.invoice?.payment.recipientName ?? settings.venmoRecipientName}</strong> before making a business purchase payment. Include the invoice and order references in your payment note.</p></div></li>
      <li><span className="step-number">03</span><div><ShieldCheck size={22} /><h3>We verify your payment</h3><p>Your request stays unpaid until payment is verified. We’ll email you with confirmation and the next steps. If you have already paid, contact us instead of paying again.</p></div></li>
    </ol><div className="confirmation-help"><h3>A detail needs changing?</h3><p>Email us with your order reference before paying.</p><a href={`mailto:${settings.supportEmail}?subject=${encodeURIComponent(`Order request ${order.id}`)}`}>{settings.supportEmail} ↗</a></div></section>
    <aside className="order-summary"><span className="eyebrow">SAVED ORDER REQUEST</span><h2>Your summary</h2>{order.items.map(item => <div className="summary-line" key={item.productId}><div>{item.name}<small>{item.massMg} mg × {item.quantity}</small></div><b>{money(item.unitPriceCents * item.quantity)}</b></div>)}<dl><div className="summary-total"><dt>Estimated subtotal</dt><dd>{money(order.estimatedSubtotalCents)}</dd></div><div><dt>Payment collected</dt><dd>{money(0)}</dd></div></dl><p className="request-fineprint">Final charges and availability are confirmed on your invoice.</p><div className="saved-details"><h3>Contact &amp; delivery</h3><address>{order.customer.fullName}<br />{order.customer.email}<br />{order.customer.address1}<br />{order.customer.address2 && <>{order.customer.address2}<br /></>}{[order.customer.city, order.customer.region, order.customer.postalCode].filter(Boolean).join(', ')}<br />{order.customer.country}</address></div><a className="button full" href="/compounds/">Back to the catalog <ArrowRight size={16} /></a></aside>
    </div></>}
  </div>;
}
