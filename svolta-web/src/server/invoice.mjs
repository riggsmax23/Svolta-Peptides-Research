import { z } from 'zod';
import { CheckoutError, hash, publicOrder } from './checkout.mjs';

const cents = z.number().int().min(0).max(10000000);
const invoiceSchema = z.object({ shippingCents: cents, taxCents: cents, availabilityConfirmed: z.literal(true), chargesConfirmed: z.literal(true) }).strict();
const usd = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function renderInvoice(order, settings) {
  if (!order.invoice) throw new CheckoutError(409, 'Review and prepare an invoice first.');
  const invoice = order.invoice;
  const recipient = invoice.payment;
  return {
    subject: `Svolta invoice ${invoice.number} — payment instructions`,
    text: `Hi ${order.customer.fullName},\n\nThank you for your order request. Your reviewed invoice and payment instructions are below. No payment was collected on our website.\n\nINVOICE DETAILS\nInvoice: ${invoice.number}\nOrder reference: ${order.id}\n\n${order.items.map(item => `${item.name} · ${item.massMg} mg × ${item.quantity} — ${usd(item.unitPriceCents * item.quantity)}`).join('\n')}\n\nSubtotal: ${usd(order.estimatedSubtotalCents)}\nShipping: ${usd(invoice.shippingCents)}\nTax: ${usd(invoice.taxCents)}\nTOTAL DUE: ${usd(invoice.totalCents)} USD\n\nHOW TO PAY\n1. Open Venmo and find @${recipient.handle}.\n2. Verify that the displayed recipient name is ${recipient.recipientName} and that you are using the business purchase flow. If either detail differs, contact us before paying.\n3. Pay exactly ${usd(invoice.totalCents)} USD.\n4. Include ${invoice.number} / ${order.id} in your payment note. Do not include your address or other personal information.\n\nYour request remains unpaid until we verify receipt. We will email you after verification. If you have already paid, contact us with your order reference rather than paying twice.\n\nIf an item, your details, or the amount needs correcting, reply before sending payment.\n\nQuestions? Reply to this email or contact ${invoice.supportEmail ?? settings.supportEmail}.\n\nThank you,\n${settings.senderName}\n\nFor laboratory research only. Not for human or veterinary use.`,
  };
}
async function orderRow(store, id) {
  const row = (await store.query('SELECT * FROM order_requests WHERE id = ?', [id]))[0];
  if (!row) throw new CheckoutError(404, 'Order not found.');
  return row;
}
export async function prepareInvoice(store, id, input, settings, now = Date.now()) {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) throw new CheckoutError(400, 'Confirm availability and final charges. Shipping and tax must be nonnegative amounts in cents.');
  const row = await orderRow(store, id);
  if (['sending', 'accepted', 'unknown', 'manual_sent'].includes(row.email_status)) throw new CheckoutError(409, 'This invoice has been sent or delivery needs checking. Contact the customer before making changes.');
  const invoice = {
    number: `INV-${id}`, ...parsed.data,
    totalCents: row.subtotal_cents + parsed.data.shippingCents + parsed.data.taxCents,
    preparedAt: new Date(now).toISOString(),
    payment: { handle: settings.venmoHandle, recipientName: settings.venmoRecipientName },
    senderEmail: settings.senderEmail, supportEmail: settings.supportEmail,
  };
  const updated = await store.query(`UPDATE order_requests SET invoice_json = ?, email_status = 'prepared', email_provider_id = NULL, email_claimed_at = NULL
    WHERE id = ? AND email_status NOT IN ('sending', 'accepted', 'unknown', 'manual_sent') AND (invoice_json = ? OR (invoice_json IS NULL AND ? IS NULL)) RETURNING *`,
    [JSON.stringify(invoice), id, row.invoice_json, row.invoice_json]);
  if (!updated.length) throw new CheckoutError(409, 'This invoice changed in another window. Reload it before continuing.');
  return publicOrder(updated[0]);
}
export async function sendInvoice(store, id, settings, env, fetcher = fetch, now = Date.now()) {
  if (!settings.emailEnabled || !env.RESEND_API_KEY) throw new CheckoutError(503, 'Email sending is not connected. Copy the prepared invoice and send it from your verified business mailbox.');
  const row = await orderRow(store, id);
  const order = publicOrder(row);
  if (!order.invoice) throw new CheckoutError(409, 'Prepare this invoice first.');
  if (['accepted', 'manual_sent'].includes(row.email_status)) return order;
  if (!['prepared', 'failed'].includes(row.email_status)) throw new CheckoutError(409, 'Delivery is in progress or uncertain. Check your email provider before sending again.');
  // Provider idempotency expires after 24 hours. Never retry an old ambiguous send.
  if (row.email_claimed_at && now - Date.parse(row.email_claimed_at) > 23 * 3600000) throw new CheckoutError(409, 'Check the provider delivery log before preparing a new invoice. The retry window has ended.');
  const claimedAt = row.email_claimed_at ?? new Date(now).toISOString();
  const claimed = await store.query("UPDATE order_requests SET email_status = 'sending', email_claimed_at = ? WHERE id = ? AND invoice_json = ? AND email_status IN ('prepared', 'failed') RETURNING id", [claimedAt, id, row.invoice_json]);
  if (!claimed.length) throw new CheckoutError(409, 'Another send is already in progress. Reload this request.');
  const content = renderInvoice(order, settings);
  let response;
  try {
    response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `invoice/${id}/${hash(row.invoice_json)}` },
      body: JSON.stringify({ from: `${settings.senderName} <${order.invoice.senderEmail}>`, to: [order.customer.email], reply_to: order.invoice.supportEmail, ...content }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await store.query("UPDATE order_requests SET email_status = 'unknown' WHERE id = ? AND email_status = 'sending'", [id]);
    throw new CheckoutError(502, 'The invoice is saved, but delivery is uncertain. Check the provider log before sending again.');
  }
  if (!response.ok) {
    // A server failure can occur after acceptance. Only definite 4xx rejections
    // (excluding timeout/conflict) are safe to mark as failed for a bounded retry.
    const state = response.status >= 400 && response.status < 500 && ![408, 409].includes(response.status) ? 'failed' : 'unknown';
    await store.query('UPDATE order_requests SET email_status = ? WHERE id = ? AND email_status = ?', [state, id, 'sending']);
    throw new CheckoutError(502, state === 'failed' ? 'The email provider rejected this invoice. Check the sender configuration before retrying.' : 'Email delivery is uncertain. Check the provider log before sending again.');
  }
  let provider;
  try { provider = await response.json(); } catch { provider = null; }
  if (!provider?.id) {
    await store.query("UPDATE order_requests SET email_status = 'unknown' WHERE id = ? AND email_status = 'sending'", [id]);
    throw new CheckoutError(502, 'Email acceptance could not be confirmed. Check the provider log before sending again.');
  }
  await store.query("UPDATE order_requests SET email_status = 'accepted', email_provider_id = ?, status = 'awaiting_payment' WHERE id = ? AND email_status = 'sending'", [String(provider.id), id]);
  return publicOrder(await orderRow(store, id));
}
export async function markManuallySent(store, id) {
  const changed = await store.query("UPDATE order_requests SET email_status = 'manual_sent', status = 'awaiting_payment' WHERE id = ? AND invoice_json IS NOT NULL AND email_status IN ('prepared', 'failed') RETURNING *", [id]);
  if (!changed.length) throw new CheckoutError(409, 'Prepare an invoice first. Check any uncertain email delivery before recording a manual send.');
  return publicOrder(changed[0]);
}
