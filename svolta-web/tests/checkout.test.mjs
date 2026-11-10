import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeRequest, saveRequest, getOwnedOrder, ownerAuthorized, hash, requireSameOrigin, readJson, cookieToken, sessionCookie } from '../src/server/checkout.mjs';
import { prepareInvoice, renderInvoice, sendInvoice, markManuallySent } from '../src/server/invoice.mjs';
import { orderStore, recordAnalytics } from '../src/server/store.mjs';
const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url))).products;
const settings = JSON.parse(readFileSync(new URL('../src/data/checkout.json', import.meta.url)));
const databasePath = () => join(mkdtempSync(join(tmpdir(), 'svolta-test-')), 'orders.sqlite');
function database(path = ':memory:', initialize = true) {
  const db = new DatabaseSync(path);
  if (initialize) for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  const binding = { prepare: sql => ({ bind: (...args) => ({ all: async () => ({ success: true, results: db.prepare(sql).all(...args) }) }) }) };
  return { db, binding, store: orderStore({ DB: binding }) };
}
function input(overrides = {}) {
  return { idempotencyKey: randomUUID(), customer: { fullName: 'Research Test', email: 'test@example.invalid', address1: '100 Example Street', address2: '', city: 'Example City', region: 'UT', postalCode: '00000', country: 'United States' }, items: [{ productId: 'bpc-157', quantity: 2 }], ageConfirmed: true, researchConfirmed: true, invoiceConfirmed: true, website: '', ...overrides };
}
const owner = hash('test owner'); const ip = hash('test ip');
test('server computes cents from catalog and rejects price tampering and invalid declarations', () => {
  assert.equal(normalizeRequest(input(), catalog).estimatedSubtotalCents, 9998);
  for (const payload of [input({ items: [{ productId: 'bpc-157', quantity: 2, priceCents: 1 }] }), input({ ageConfirmed: false }), input({ researchConfirmed: false }), input({ invoiceConfirmed: false }), input({ website: 'spam' }), input({ items: [{ productId: 'unknown', quantity: 1 }] }), input({ items: [{ productId: 'bpc-157', quantity: 21 }] }), input({ items: [{ productId: 'bpc-157', quantity: 1.5 }] })]) assert.throws(() => normalizeRequest(payload, catalog), e => e.status === 400);
  assert.throws(() => normalizeRequest(input({ items: [{ productId: 'bpc-157', quantity: 15 }, { productId: 'bpc-157', quantity: 15 }] }), catalog), e => e.status === 400);
});
test('real record survives reopening; acknowledgments are saved; another browser cannot retrieve it', async () => {
  const path = databasePath(); const first = database(path);
  const saved = await saveRequest(first.store, input(), catalog, owner, ip);
  assert.equal(saved.status, 'awaiting_invoice'); assert.equal(saved.emailStatus, 'not_prepared'); assert.equal(saved.invoice, null);
  const ack = JSON.parse(first.db.prepare('SELECT acknowledgments_json FROM order_requests').get().acknowledgments_json);
  assert.equal(ack.age21, true); assert.equal(ack.laboratoryResearchOnly, true); first.db.close();
  const reopened = database(path, false);
  assert.equal((await getOwnedOrder(reopened.store, saved.id, owner)).estimatedSubtotalCents, 9998);
  await assert.rejects(getOwnedOrder(reopened.store, saved.id, hash('another visitor')), e => e.status === 404);
  reopened.db.close();
});
test('retries and concurrent submits produce one unpaid order, even after catalog changes', async () => {
  const { db, store } = database(); const data = input();
  const results = await Promise.all([saveRequest(store, data, catalog, owner, ip), saveRequest(store, data, catalog, owner, ip)]);
  assert.equal(results[0].id, results[1].id); assert.equal(db.prepare('SELECT count(*) n FROM order_requests').get().n, 1);
  const changedCatalog = catalog.map(p => ({ ...p, priceCents: p.priceCents + 500 }));
  assert.equal((await saveRequest(store, data, changedCatalog, owner, ip)).estimatedSubtotalCents, 9998);
  await assert.rejects(saveRequest(store, { ...data, items: [{ productId: 'bpc-157', quantity: 3 }] }, catalog, owner, ip), e => e.status === 409);
  db.close();
});
test('rate limits persist across requests', async () => {
  const { db, store } = database();
  for (let i = 0; i < 15; i++) await saveRequest(store, input(), catalog, owner, ip);
  await assert.rejects(saveRequest(store, input(), catalog, owner, ip), e => e.status === 429);
  assert.equal(db.prepare('SELECT count(*) n FROM order_requests').get().n, 15); db.close();
});
test('invoice requires owner-confirmed availability and charges; editable settings snapshot into invoice', async () => {
  const { db, store } = database(); const saved = await saveRequest(store, input(), catalog, owner, ip);
  await assert.rejects(prepareInvoice(store, saved.id, { shippingCents: 500, taxCents: 0, availabilityConfirmed: false, chargesConfirmed: true }, settings), e => e.status === 400);
  await assert.rejects(prepareInvoice(store, saved.id, { shippingCents: -1, taxCents: 0, availabilityConfirmed: true, chargesConfirmed: true }, settings), e => e.status === 400);
  const prepared = await prepareInvoice(store, saved.id, { shippingCents: 500, taxCents: 699, availabilityConfirmed: true, chargesConfirmed: true }, settings);
  assert.equal(prepared.invoice.totalCents, 11197); assert.equal(prepared.status, 'awaiting_invoice');
  const email = renderInvoice(prepared, settings);
  assert.match(email.text, /@Riggsmax23/); assert.match(email.text, /Max Riggs/); assert.match(email.text, /\$111\.97/);
  let calls = 0;
  await assert.rejects(sendInvoice(store, saved.id, settings, {}, async () => { calls++; }), e => e.status === 503);
  assert.equal(calls, 0); assert.equal((await getOwnedOrder(store, saved.id, owner)).emailStatus, 'prepared');
  const manual = await markManuallySent(store, saved.id); assert.equal(manual.status, 'awaiting_payment'); assert.equal(manual.emailStatus, 'manual_sent');
  await assert.rejects(prepareInvoice(store, saved.id, { shippingCents: 0, taxCents: 0, availabilityConfirmed: true, chargesConfirmed: true }, settings), e => e.status === 409);
  db.close();
});
test('owner guard does not trust Sites identity headers on Vercel or accept another Sites user', () => {
  const request = new Request('https://svolta.example/api/manage/orders', { headers: { 'oai-authenticated-user-id': '4489fc0c-4b67-467b-9c0c-853bc099f5e8' } });
  assert.equal(ownerAuthorized(request, {}), false); assert.equal(ownerAuthorized(request, { DB: { prepare() {} } }), false);
  assert.equal(ownerAuthorized(request, { DB: { prepare() {} }, ORDER_OWNER_USER_ID: '4489fc0c-4b67-467b-9c0c-853bc099f5e8' }), true);
  assert.equal(ownerAuthorized(request, { DB: { prepare() {} }, ORDER_OWNER_USER_ID: 'other' }), false);
  const verifiedOwner = new Request(request, { headers: { 'oai-authenticated-user-id': 'site-scoped-owner', 'oai-authenticated-user-email': 'owner@example.invalid' } });
  assert.equal(ownerAuthorized(verifiedOwner, { DB: { prepare() {} }, ORDER_OWNER_EMAIL: 'owner@example.invalid' }), true);
  assert.equal(ownerAuthorized(verifiedOwner, { ORDER_OWNER_EMAIL: 'owner@example.invalid' }), false);
  const key = 'a-secure-management-key-with-32-plus-characters';
  assert.equal(ownerAuthorized(new Request(request, { headers: { Authorization: `Bearer ${key}` } }), { ORDER_ADMIN_KEY: key }), true);
  assert.equal(ownerAuthorized(new Request(request, { headers: { Authorization: 'Bearer wrong' } }), { ORDER_ADMIN_KEY: key }), false);
});
test('writes reject foreign origins, malformed JSON and oversized bodies; cookie is HttpOnly', async () => {
  assert.throws(() => requireSameOrigin(new Request('https://svolta.example/api/orders', { method: 'POST', headers: { origin: 'https://attacker.example' } })), e => e.status === 403);
  requireSameOrigin(new Request('https://svolta.example/api/orders', { method: 'POST', headers: { origin: 'https://svolta.example' } }));
  await assert.rejects(readJson(new Request('https://svolta.example/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(21000) })), e => e.status === 413);
  await assert.rejects(readJson(new Request('https://svolta.example/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad' })), e => e.status === 400);
  const request = new Request('https://svolta.example', { headers: { cookie: `svolta_order_session=${'a'.repeat(64)}` } });
  assert.equal(cookieToken(request), 'a'.repeat(64)); assert.match(sessionCookie('a'.repeat(64), request), /HttpOnly; SameSite=Lax/); assert.match(sessionCookie('a'.repeat(64), request), /; Secure/);
});
test('missing durable storage fails closed, and Turso transport uses bound parameters', async () => {
  assert.throws(() => orderStore({}), /not configured/);
  let posted;
  const store = orderStore({ TURSO_DATABASE_URL: 'libsql://example.turso.io', TURSO_AUTH_TOKEN: 'test' }, async (url, init) => {
    assert.equal(String(url), 'https://example.turso.io/v2/pipeline'); posted = JSON.parse(init.body);
    return Response.json({ results: [{ type: 'ok', response: { result: { cols: [{ name: 'count' }], rows: [[{ type: 'integer', value: '5' }]] } } }, { type: 'ok' }] });
  });
  assert.deepEqual(await store.query('SELECT ? AS count', [5]), [{ count: 5 }]);
  assert.equal(posted.requests[0].stmt.sql, 'SELECT ? AS count'); assert.deepEqual(posted.requests[0].stmt.args, [{ type: 'integer', value: '5' }]); assert.equal(posted.requests.at(-1).type, 'close');
});

test('analytics requires explicit opt-in and refuses private paths, query strings and extra customer fields', async () => {
  const { db, store } = database();
  for (const input of [
    { consent: false, path: '/', event: 'page_view' },
    { consent: true, path: '/checkout/complete/?order=secret', event: 'page_view' },
    { consent: true, path: '/manage/orders/', event: 'page_view' },
    { consent: true, path: '/?email=customer@example.com', event: 'page_view' },
    { consent: true, path: '/', event: 'page_view', email: 'customer@example.com' },
  ]) await assert.rejects(recordAnalytics(store, input, ['/', '/compounds/']), error => error.status === 400);
  assert.equal(db.prepare('SELECT count(*) AS n FROM analytics_daily').get().n, 0);
  db.close();
});
test('analytics aggregates counts without visitor records and removes expired daily counters', async () => {
  const { db, store } = database();
  const input = { consent: true, path: '/compounds/', event: 'page_view' };
  await recordAnalytics(store, input, ['/compounds/'], 90, new Date('2026-01-01T12:00:00Z'));
  await recordAnalytics(store, input, ['/compounds/'], 90, new Date('2026-11-01T12:00:00Z'));
  await recordAnalytics(store, input, ['/compounds/'], 90, new Date('2026-11-01T12:00:00Z'));
  assert.deepEqual(db.prepare('SELECT day, path, event, count FROM analytics_daily').all().map(row => ({...row})), [{ day: '2026-11-01', path: '/compounds/', event: 'page_view', count: 2 }]);
  const columns = db.prepare('PRAGMA table_info(analytics_daily)').all().map(row => row.name);
  assert.deepEqual(columns, ['day', 'path', 'event', 'count']);
  db.close();
});
