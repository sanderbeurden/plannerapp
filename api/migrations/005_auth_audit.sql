CREATE TABLE IF NOT EXISTS auth_audit (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  ip TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS auth_audit_email_idx ON auth_audit(email);
CREATE INDEX IF NOT EXISTS auth_audit_created_idx ON auth_audit(created_at);
