import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { db } from "./client";

const migrationsDir = fileURLToPath(new URL("../../migrations", import.meta.url));
const files = readdirSync(migrationsDir)
  .filter(file => file.endsWith(".sql"))
  .sort();

db.exec(
  "CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))"
);

const applied = new Set<string>(
  db.query("SELECT id FROM migrations").all().map(row => row.id as string)
);

for (const file of files) {
  if (applied.has(file)) {
    continue;
  }

  const sql = readFileSync(`${migrationsDir}/${file}`, "utf8");
  db.transaction(() => {
    db.exec(sql);
    db.query("INSERT INTO migrations (id) VALUES (?)").run(file);
  })();
  console.log(`Applied migration ${file}`);
}
