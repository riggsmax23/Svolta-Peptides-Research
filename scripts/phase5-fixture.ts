// Extend only an explicitly selected isolated Phase 4 fixture; never owner data.
import { randomUUID } from "node:crypto";
if (
  !process.env.DATABASE_PATH?.includes("svolta-phase4-isolated-") ||
  process.env.ISOLATED_TEST_FIXTURES !== "1"
)
  throw Error("Select the isolated Phase 4 fixture explicitly.");
const { db } = await import("../src/lib/db");
const { registerCustomer, issueToken, consumeToken } =
  await import("../src/lib/customers");
const { referralCode, qualifyReferral } = await import("../src/lib/business");
const { customerCart, mutateCart, createIntent, placeTestOrder } =
  await import("../src/lib/commerce");
const referrer = String(
  db()
    .prepare("SELECT id FROM customers WHERE email=?")
    .get("phase4-customer@example.invalid")!.id,
);
await registerCustomer(
  "phase5-referred@example.invalid",
  randomUUID(),
  "Simulated Referred Researcher",
  referralCode(referrer),
);
const referred = String(
  db()
    .prepare("SELECT id FROM customers WHERE email=?")
    .get("phase5-referred@example.invalid")!.id,
);
await consumeToken(issueToken(referred, "verify"), "verify");
let cart = customerCart(referred);
mutateCart(cart.id, "bpc-157", 1, "set");
cart = customerCart(referred);
const id = placeTestOrder(
  referred,
  createIntent(referred, cart),
  {
    name: "Simulated Referred Researcher",
    line1: "456 Test Avenue",
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
db().exec("BEGIN IMMEDIATE");
try {
  db()
    .prepare("UPDATE test_orders SET status='simulated_reviewed' WHERE id=?")
    .run(id);
  qualifyReferral(id);
  db().exec("COMMIT");
} catch (e) {
  db().exec("ROLLBACK");
  throw e;
}
console.log(
  JSON.stringify({
    sourceOrder: id,
    reward: db()
      .prepare(
        "SELECT id,code,status FROM referral_rewards WHERE referred_id=?",
      )
      .get(referred),
  }),
);
