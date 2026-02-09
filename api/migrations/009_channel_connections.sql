CREATE TABLE IF NOT EXISTS channel_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected')),
  account_name TEXT,
  external_account_id TEXT,
  connected_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS channel_connections_user_idx ON channel_connections(user_id);
CREATE INDEX IF NOT EXISTS channel_connections_user_platform_idx
ON channel_connections(user_id, platform);
