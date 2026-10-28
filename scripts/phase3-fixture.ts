// Isolated development fixture only. Never points at the owner database.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import { PDFDocument } from "pdf-lib";
const root = mkdtempSync(join(tmpdir(), "svolta-phase3-isolated-"));
process.env.DATABASE_PATH = join(root, "fixture.sqlite");
const { db } = await import("../src/lib/db");
const { createReport } = await import("../src/lib/documentation");
const password = randomUUID();
const actor = randomUUID();
db()
  .prepare("INSERT INTO admins(id,email,password_hash) VALUES(?,?,?)")
  .run(actor, "phase3@example.invalid", hashSync(password, 12));
const pdf = await PDFDocument.create();
const page = pdf.addPage();
page.drawText("SIMULATED TEST DOCUMENT", { x: 40, y: 750, size: 23 });
page.drawText("NOT A CERTIFICATE OF ANALYSIS", { x: 40, y: 705, size: 18 });
page.drawText("Isolated development fixture. Contains no analytical results.", {
  x: 40,
  y: 660,
  size: 13,
});
const bytes = await pdf.save();
writeFileSync(join(root, "not-a-coa.pdf"), bytes);
const meta = {
  laboratory: "SIMULATED TEST ONLY - NO LABORATORY",
  reportDate: "2026-01-01",
  reportNumber: "SIMULATED-NOT-A-COA",
  evidence: "Supplier-provided",
  tests: [],
  notes:
    "SIMULATED fixture in an isolated development database. Not a certificate. No test values. Never use for product documentation.",
};
const id = await createReport(
  actor,
  "bpc-157",
  "SIMULATED-TEST-ONLY",
  meta,
  bytes,
  true,
  true,
);
await createReport(
  actor,
  "ghk-cu",
  "SIMULATED-OLDER",
  { ...meta, reportDate: "2025-01-01" },
  bytes,
  true,
  true,
);
await createReport(
  actor,
  "bpc-157",
  "SIMULATED-PRIVATE",
  meta,
  bytes,
  false,
  false,
);
writeFileSync(
  join(root, "fixture.json"),
  JSON.stringify({
    root,
    database: process.env.DATABASE_PATH,
    email: "phase3@example.invalid",
    password,
    actor,
    id,
  }),
);
console.log(
  JSON.stringify({
    root,
    database: process.env.DATABASE_PATH,
    email: "phase3@example.invalid",
    password,
    id,
  }),
);
