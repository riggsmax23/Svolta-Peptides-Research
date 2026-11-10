import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export class CheckoutError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const text = (max) => z.string().trim().min(1).max(max).refine(s => !/[\u0000-\u001f\u007f]/.test(s), 'Invalid text');
const optionalText = z.string().trim().max(160).refine(s => !/[\u0000-\u001f\u007f]/.test(s), 'Invalid text').default('');
export const requestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: z.object({
    fullName: text(120),
    email: z.string().trim().email().max(254).transform(s => s.toLowerCase()),
    address1: text(160), address2: optionalText, city: text(100),
    region: optionalText, postalCode: optionalText, country: text(80),
  }).strict(),
  items: z.array(z.object({ productId: z.string().min(1).max(80), quantity: z.number().int().min(1).max(20) }).strict()).min(1).max(20),
  ageConfirmed: z.literal(true), researchConfirmed: z.literal(true), invoiceConfirmed: z.literal(true),
  website: z.literal('').optional(),
}).strict();
export const hash = value => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
const validToken = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function cookieToken(request, name = 'svolta_order_session') {
  const value = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`))?.slice(name.length + 1);
  return validToken(value) ? value : null;
}
export function sessionCookie(token, request) {
  return `svolta_order_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function requireSameOrigin(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new CheckoutError(403, 'Please submit this form from the Svolta website.');
  }
}
export async function readJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new CheckoutError(415, 'Please use the checkout form.');
  const reader = request.body?.getReader();
  if (!reader) throw new CheckoutError(400, 'Missing form details.');
  const chunks = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 20000) { await reader.cancel(); throw new CheckoutError(413, 'The request is too large.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new CheckoutError(400, 'Please check your form details.'); }
}
export function normalizeRequest(input, catalog) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) throw new CheckoutError(400, 'Check your contact details, shipping address, quantities, and all three acknowledgments.');
  const grouped = new Map();
  for (const item of parsed.data.items) grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity);
  const items = [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([id, quantity]) => {
    const product = catalog.find(p => p.id === id);
    if (!product || quantity > 20) throw new CheckoutError(400, 'A requested item or quantity is unavailable. Please update your cart.');
    return { productId: product.id, name: product.name, massMg: product.massMg, unitPriceCents: product.priceCents, quantity, availabilityConfirmed: product.available };
  });
  const estimatedSubtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  return { ...parsed.data, items, estimatedSubtotalCents };
}
export function publicOrder(row) {
  return {
    id: row.id, createdAt: row.created_at, status: row.status,
    customer: JSON.parse(row.customer_json), items: JSON.parse(row.items_json),
    estimatedSubtotalCents: row.subtotal_cents,
    invoice: row.invoice_json ? JSON.parse(row.invoice_json) : null,
    emailStatus: row.email_status,
  };
}
export async function saveRequest(store, input, catalog, ownerHash, rateKey, now = Date.now()) {
  const data = normalizeRequest(input, catalog);
  // Hash the submitted facts separately from prices, so a later catalog edit does
  // not turn a retry of a successfully saved request into a different request.
  const payloadHash = hash(JSON.stringify({ customer: data.customer, items: data.items.map(({productId, quantity}) => ({productId, quantity})) }));
  const existing = (await store.query('SELECT * FROM order_requests WHERE owner_hash = ? AND idempotency_key = ?', [ownerHash, data.idempotencyKey]))[0];
  if (existing) {
    if (existing.payload_hash !== payloadHash) throw new CheckoutError(409, 'This request was already submitted with different details. Start a new request to make changes.');
    return publicOrder(existing);
  }
  // Bounded, durable rate limits across Worker instances; only hashed keys stored.
  const bucket = Math.floor(now / 3600000);
  for (const key of [ownerHash, rateKey]) {
    const result = await store.query('INSERT INTO checkout_limits (key, bucket, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN bucket = excluded.bucket THEN count + 1 ELSE 1 END, bucket = excluded.bucket RETURNING count', [key, bucket]);
    if (result[0]?.count > 15) throw new CheckoutError(429, 'Too many requests. Please try again later or email Svolta.');
  }
  const id = `SV-${new Date(now).toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(6).toString('hex').toUpperCase()}`;
  await store.query(`INSERT INTO order_requests
    (id, owner_hash, idempotency_key, payload_hash, customer_json, items_json, subtotal_cents, status, created_at, email_status, acknowledgments_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'awaiting_invoice', ?, 'not_prepared', ?)
    ON CONFLICT(owner_hash, idempotency_key) DO NOTHING`,
    [id, ownerHash, data.idempotencyKey, payloadHash, JSON.stringify(data.customer), JSON.stringify(data.items), data.estimatedSubtotalCents, new Date(now).toISOString(), JSON.stringify({ age21: true, laboratoryResearchOnly: true, unpaidInvoiceRequest: true, version: '2026-10-29' })]);
  const row = (await store.query('SELECT * FROM order_requests WHERE owner_hash = ? AND idempotency_key = ?', [ownerHash, data.idempotencyKey]))[0];
  if (!row) throw new Error('Order could not be saved');
  if (row.payload_hash !== payloadHash) throw new CheckoutError(409, 'This request was already submitted with different details.');
  return publicOrder(row);
}
export async function getOwnedOrder(store, id, ownerHash) {
  const row = (await store.query('SELECT * FROM order_requests WHERE id = ? AND owner_hash = ?', [id, ownerHash]))[0];
  if (!row) throw new CheckoutError(404, 'This order is not available in this browser. Contact Svolta with your order reference for help.');
  return publicOrder(row);
}
export function ownerAuthorized(request, env) {
  // Dispatch supplies these headers only on Sites. Never trust them on Vercel.
  if (env.DB?.prepare) {
    const id = request.headers.get('oai-authenticated-user-id');
    const email = request.headers.get('oai-authenticated-user-email');
    if (id && ((env.ORDER_OWNER_USER_ID && id === env.ORDER_OWNER_USER_ID)
      || (env.ORDER_OWNER_EMAIL && email?.toLowerCase() === env.ORDER_OWNER_EMAIL.toLowerCase()))) return true;
  }
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const expected = env.ORDER_ADMIN_KEY;
  return typeof expected === 'string' && expected.length >= 32 && timingSafeEqual(Buffer.from(hash(supplied)), Buffer.from(hash(expected)));
}
export function requireOwner(request, env) {
  if (!ownerAuthorized(request, env)) throw new CheckoutError(403, 'Owner access required. Sign in as the Site owner, or use the configured management key.');
}
export function errorResponse(error) {
  const known = error instanceof CheckoutError;
  // Never leak SQL, customer details, credentials, or provider error payloads.
  return Response.json({ error: known ? error.message : 'Order services are temporarily unavailable. Your request has not been confirmed. Please try again or email Svolta.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
export const privateJson = data => Response.json(data, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
