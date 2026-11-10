CREATE TABLE `checkout_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`customer_json` text NOT NULL,
	`items_json` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`status` text DEFAULT 'awaiting_invoice' NOT NULL,
	`created_at` text NOT NULL,
	`acknowledgments_json` text DEFAULT '{}' NOT NULL,
	`invoice_json` text,
	`email_status` text DEFAULT 'not_prepared' NOT NULL,
	`email_provider_id` text,
	`email_claimed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_owner_request` ON `order_requests` (`owner_hash`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_created` ON `order_requests` (`created_at`);