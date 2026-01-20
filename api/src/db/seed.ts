import bcrypt from "bcryptjs";

import { db } from "./client";

const PASSWORD_MAX_BYTES = 72;

const email = process.env.OWNER_EMAIL ?? "owner@salon.com";
const password = process.env.OWNER_PASSWORD ?? "changeme";
const name = process.env.OWNER_NAME ?? "Owner";

if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
  console.error("Password exceeds 72 byte limit.");
  process.exit(1);
}

const existing = db
  .query("SELECT id FROM users WHERE email = ?")
  .get(email) as { id: string } | null;

if (existing) {
  console.log(`Owner already exists (${email}).`);
  process.exit(0);
}

const passwordHash = bcrypt.hashSync(password, 10);
const id = crypto.randomUUID();

db.query(
  "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)"
).run(id, name, email, passwordHash);

console.log(`Created owner user (${email}).`);
