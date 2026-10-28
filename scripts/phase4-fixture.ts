import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
const root = mkdtempSync(join(tmpdir(), "svolta-phase4-isolated-"));
process.env.DATABASE_PATH = join(root, "fixture.sqlite");
const { db, products, updateRecord } = await import("../src/lib/db");
const { registerCustomer } = await import("../src/lib/customers");
const { customerCart, mutateCart, createIntent, placeTestOrder } =
  await import("../src/lib/commerce");
const password = randomUUID(),
  adminPassword = randomUUID(),
  actor = randomUUID();
db()
  .prepare("INSERT INTO admins(id,email,password_hash) VALUES(?,?,?)")
  .run(actor, "phase4-admin@example.invalid", hashSync(adminPassword, 12));
for (const p of products())
  updateRecord(actor, "product", p.id, { ...p, available: true });
await registerCustomer(
  "phase4-customer@example.invalid",
  password,
  "Simulated Researcher",
);
await registerCustomer(
  "other-customer@example.invalid",
  randomUUID(),
  "Other Simulated Researcher",
);
const other = db()
  .prepare("SELECT id FROM customers WHERE email=?")
  .get("other-customer@example.invalid")!;
db()
  .prepare("UPDATE customers SET verified_at=CURRENT_TIMESTAMP WHERE id=?")
  .run(other.id);
let cart = customerCart(String(other.id));
mutateCart(cart.id, "ghk-cu", 1, "add");
cart = customerCart(String(other.id));
const order = placeTestOrder(
  String(other.id),
  createIntent(String(other.id), cart),
  {
    name: "Other Simulated Researcher",
    line1: "123 Test Street",
    line2: "",
    city: "Provo",
    state: "UT",
    zip: "84601",
    country: "US",
  },
  true,
  false,
  "",
);
const fixture = {
  root,
  database: process.env.DATABASE_PATH,
  email: "phase4-customer@example.invalid",
  password,
  adminEmail: "phase4-admin@example.invalid",
  adminPassword,
  otherOrder: order,
};
writeFileSync(join(root, "fixture.json"), JSON.stringify(fixture));
console.log(JSON.stringify(fixture));
