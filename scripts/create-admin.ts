import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "../src/lib/db";
const rl = createInterface({ input: stdin, output: stdout });
try {
  const email = (await rl.question("Admin email (unique individual account): "))
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw Error("Valid email required");
  console.log(
    "Enter a unique password (at least 14 characters). Input is hidden.",
  );
  rl.close();
  let password = "";
  if (!stdin.isTTY) throw Error("Run this command in an interactive terminal");
  stdin.setRawMode(true);
  stdin.resume();
  password = await new Promise<string>((resolve, reject) => {
    const listener = (chunk: Buffer) => {
      const s = chunk.toString();
      if (s.includes("\u0003")) {
        stdin.off("data", listener);
        reject(Error("Canceled"));
      } else if (s.includes("\r") || s.includes("\n")) {
        stdin.off("data", listener);
        resolve(password);
      } else if (s === "\u007f") password = password.slice(0, -1);
      else password += s;
    };
    stdin.on("data", listener);
  });
  stdin.setRawMode(false);
  stdin.pause();
  if (password.length < 14 || Buffer.byteLength(password, "utf8") > 72)
    throw Error("Use 14–72 characters");
  db()
    .prepare("INSERT INTO admins(id,email,password_hash) VALUES(?,?,?)")
    .run(randomUUID(), email, await hash(password, 12));
  console.log(
    "\nAdministrator created. No credentials were written to source.",
  );
} catch (e) {
  if (stdin.isTTY) stdin.setRawMode(false);
  console.error(
    e instanceof Error ? e.message : "Unable to create administrator",
  );
  process.exitCode = 1;
} finally {
  rl.close();
}
