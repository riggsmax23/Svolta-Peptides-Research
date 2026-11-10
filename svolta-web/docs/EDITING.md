# Editing Svolta in Codex

All content and behavior remain editable after hosting on Sites or Vercel. This full source is the working project; generated builds are disposable.

Page navigation uses standard `<a href>` links. The current Sites/Vinext production link router fails during prefetch and click handling, so do not restore `next/link` or client-router navigation without testing a production build through actual clicks. The cart persists across document navigation; successful checkout clears its storage before navigating to the saved receipt.

## Where to edit

| File | Controls |
|---|---|
| `src/data/checkout.json` | Sender and support email, Venmo handle/display name, email activation flag |
| `src/data/site-content.json` | FAQ categories/answers, supplier testing/purity/service wording, Why Choose Us |
| `src/data/catalog.json` | Catalog products, provisional prices in cents, research snapshot, page copy |
| `src/app/checkout.css` | Cart, checkout, confirmation, and owner workspace styling |
| `src/app/globals.css` | Existing storefront style and color system |
| `src/components/request-checkout.tsx` | Cart, checkout, post-completion next steps |
| `src/components/order-manager.tsx` | Owner review and invoice preview |
| `src/server/` | Durable storage, validation, ownership, invoice calculation |
| `public/brand/` | Brand and product assets |

The FAQ's `shipping` category remains `enabled: false`. Add confirmed questions/answers and enable it when ready. Supplier-dependent claims remain provisional until supported by genuine supplier documents.

The Compounds page's “What are you researching?” cards use `researchCategories` in `src/data/site-content.json`. Edit each category's title and product ID/label pairs there; IDs match `src/data/catalog.json`. Category selection resets the text/type filters and retains the selected sort. The homepage's featured selection does not display these controls.

## Website policies, metadata and analytics

`src/data/site-content.json` → `website` holds the business name, policy date, canonical origin, indexability and aggregate analytics setting. The current shared/private Site remains `indexingEnabled: false`; robots.txt, metadata and response headers deliberately prevent indexing. Changing indexing does not change Sites access permissions. Use the real production origin when moving to Vercel or a custom domain. Builds prepare robots.txt for that origin; sitemap.xml contains public content routes only and excludes carts, receipts, owner pages and queries.

Privacy is in `src/app/privacy/page.tsx`; terms, cookie and accessibility pages reuse `src/app/[section]/page.tsx`. Jurisdiction, shipping/return arrangements and a formal business retention schedule are not finalized. Review those business decisions before a public commercial launch. Policy wording must continue to match the actual implementation.

`pageMetadata` in `src/lib/site-content.ts` generates page-specific titles, descriptions, canonical URLs and Open Graph/Twitter cards. The image is `public/brand/social-share.png`. A private Site's access controls may prevent external social crawlers from fetching a preview; tags alone do not make it public.

Cookie preferences in `src/components/age-gate.tsx` default optional analytics off, offer equal allow/refuse actions, respect Global Privacy Control, and can be reopened from the footer. No GA, ad widget or third-party analytics is installed. Analytics records only day/path/event totals in `analytics_daily`, with no visitor identifiers or form values. The owner workspace shows the last 30 days. Old counters are removed during new analytics writes. Essential order/security storage remains separate.

To retain the 99-file source package, small modules were consolidated: contact/metadata helpers are in `site-content.ts`, documentation availability is in `db.ts`, order types are in `catalog.ts`, and ProductPurchase is in `cart-provider.tsx`. Their original files and unoptimized brand assets were archived outside the source folder under the project's research directory.

Edit sender and Venmo settings before creating new invoices. Prepared invoices snapshot the sender, recipient, amount, and support address; later settings edits do not silently change invoices already prepared or sent. Regenerate an unsent invoice deliberately if needed.

## Owner workflow

Open `/manage/orders`. Sites authorizes the configured `ORDER_OWNER_USER_ID` or `ORDER_OWNER_EMAIL` using its trusted sign-in headers; signing in alone does not authorize other visitors. Set the owner allowlist in Sites runtime environment settings before deployment. Vercel never trusts Sites identity headers. On Vercel or local preview, configure `ORDER_ADMIN_KEY` as a random secret of at least 32 characters. The workspace accepts it in memory and never stores it in browser storage. No default key exists.

Review the customer's details and requested items, confirm availability and delivery eligibility, and enter final shipping and tax. Prepare an invoice preview. Copy the email, send it manually from the business mailbox, then record the manual send. The request remains unpaid. Actual payment verification and subsequent communication are manual; checkout cannot verify Venmo payment.

## Email — deferred

No sending provider has been connected. Keep `emailEnabled: false`. Sender: herbert@svoltapeptideresearch.com; Venmo: @Riggsmax23 / Max Riggs. A disabled optional Resend adapter is present for future work. To resume, verify the sending domain in the provider, store `RESEND_API_KEY` in hosting secrets, review the sender, and explicitly enable the setting. Never paste keys into chat or commit them. Local tests do not send email. Provider acceptance is not proof of delivery.

## Local D1 preview

Build first using the Sites plugin build helper, then apply each pending migration exactly once, in order:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_cold_nehzno.sql
npm run dev
```

Local preview records are separate from hosted customer orders. Preserve applied migrations; append new ones for schema changes. Never reset a production database to seed it.

## Vercel portability

1. Put the full source in your own repository; keep dependencies, generated builds, credentials, customer data, and the original Sites project identity out of a public repository. This GitHub export includes only the database-binding template in `.openai/hosting.json`.
2. Create a persistent Turso/libSQL database in your account. Apply the committed SQL migrations in order with its supported SQL console/CLI before activating checkout. The same SQLite schema is used by both providers. This task does not create a paid account or database.
3. Import the repository into Vercel. `vercel.json` selects Next.js and `npm run build:vercel`, output `.next`, Node 24+. Add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and a random `ORDER_ADMIN_KEY` through Vercel's environment settings. A new database starts with no customer records; migrating existing orders is a separate deliberate task.
4. Configure access protection before releasing the site. Sites owner-private access does not transfer. Vercel/database resources are not connected by this source-only preparation.
5. Ask Codex for changes in this source, run `npm run typecheck`, `npm test`, and the intended hosting build. Push the reviewed source to the branch Vercel watches. Preview branches can be used to review updates first.

The Turso adapter uses the documented SQL over HTTP endpoint with bound parameters. It never stores data on a Vercel instance's temporary disk. An absent database fails closed with a checkout error; it never fabricates a saved order.

## GitHub upload

The source package contains 99 files, including the images, migration metadata, documentation, and configuration. Downloaded dependencies and generated builds are omitted. Upload the source, including dotfiles, to your repository; the hosting platform installs dependencies from `package-lock.json`.

Run `npm run typecheck`, `npm test`, and the build for your intended host after edits. Keep local environment files, databases, and customer records out of GitHub.
