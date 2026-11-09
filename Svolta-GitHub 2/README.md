# Svolta Research — catalog and unpaid invoice requests

The existing navy/cyan Svolta storefront, with a cart, saved unpaid requests, confirmation instructions, and protected owner invoice review. This export contains 99 source files and omits generated builds, dependencies, local data, secrets, and the original Sites project ID.

## Upload to GitHub

Open your repository and choose **Add file → Upload files**. Drag the contents of this folder into the upload area, including hidden files and folders. Keep `package.json`, `package-lock.json`, and `vercel.json` at the repository root. Extract the ZIP before uploading.

## Included

- Homepage, searchable seven-product collection, product galleries, research references, about/contact, and COA library.
- FAQ with the shipping category disabled, The Svolta Promise, Why Choose Us, and the homepage research-use disclaimer.
- Cart quantities, contact and shipping address checkout, server-calculated estimated subtotal, durable unpaid requests, and browser-owned confirmation pages.
- Private `/manage/orders` workspace: review requests, confirm availability and final shipping/tax, preview/copy an invoice, and record that it was sent manually.
- No card collection or on-site payments. Payments and fulfillment are verified manually.

Catalog entries and prices are provisional. An invoice requires owner review of availability, eligibility, and final charges. The 21+ and research-use checks are self-attestation, not identity verification. Supplier claims remain pending.

## Editable through Codex

See `docs/EDITING.md`. Every route, color, text block, product, and behavior remains source editable. `src/data/checkout.json` contains the invoice sender, support address, and Venmo details. `src/data/site-content.json` controls supplier wording, FAQ, and Why Choose Us.

## Development and verification

Node 24+. Install with the Sites plugin dependency helper (standalone: `npm ci`). `npm run dev` runs Vinext on loopback port 5173. `npm run typecheck` and `npm test` check types and the checkout domain using temporary SQLite databases. `npm run build` builds the Sites Worker; `npm run build:vercel` builds the same source for Next.js/Vercel.

D1 is declared as `DB` in `.openai/hosting.json`. Schema is in `db/schema.ts`; generate append-only migrations with `npm run db:generate`. Sites applies them to hosted D1 on deployment. For local preview, build and apply the pending SQL files to the local D1 database with Wrangler, following `docs/EDITING.md`.

## Hosting

This export does not include the original Sites project identity or access settings. Vercel uses the Next.js configuration in `vercel.json` and requires a separately configured persistent Turso database, migrations, and management key. Missing storage disables checkout rather than simulating a successful request. Sites authentication and access settings do not transfer to Vercel; configure Vercel access protection before making it available.

Automatic email sending is deferred. Prepared invoices can be copied and emailed manually from the business mailbox. The optional provider adapter is disabled until setup is explicitly resumed; no emails are sent by local tests or checkout submission.

Never upload customer records, local databases, populated environment files, `.dev.vars*`, `.wrangler/`, or secrets in a source ZIP. Edit source rather than generated `dist/` or `.next/` output.
