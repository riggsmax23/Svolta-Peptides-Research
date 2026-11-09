import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const orderRequests = sqliteTable('order_requests', {
  id: text('id').primaryKey(),
  ownerHash: text('owner_hash').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  payloadHash: text('payload_hash').notNull(),
  customerJson: text('customer_json').notNull(),
  itemsJson: text('items_json').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  status: text('status').notNull().default('awaiting_invoice'),
  createdAt: text('created_at').notNull(),
  acknowledgmentsJson: text('acknowledgments_json').notNull().default('{}'),
  invoiceJson: text('invoice_json'),
  emailStatus: text('email_status').notNull().default('not_prepared'),
  emailProviderId: text('email_provider_id'),
  emailClaimedAt: text('email_claimed_at'),
}, table => [uniqueIndex('orders_owner_request').on(table.ownerHash, table.idempotencyKey), index('orders_created').on(table.createdAt)]);

export const checkoutLimits = sqliteTable('checkout_limits', {
  key: text('key').primaryKey(),
  bucket: integer('bucket').notNull(),
  count: integer('count').notNull(),
});

export const analyticsDaily = sqliteTable('analytics_daily', {
  day: text('day').notNull(),
  path: text('path').notNull(),
  event: text('event').notNull(),
  count: integer('count').notNull().default(0),
}, table => [uniqueIndex('analytics_day_path_event').on(table.day, table.path, table.event)]);
