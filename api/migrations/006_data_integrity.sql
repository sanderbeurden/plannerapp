PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS clients_new;
DROP TABLE IF EXISTS services_new;
DROP TABLE IF EXISTS appointments_new;

DROP INDEX IF EXISTS clients_full_name_user_unique;
DROP INDEX IF EXISTS clients_user_id_idx;
DROP INDEX IF EXISTS services_user_id_idx;
DROP INDEX IF EXISTS appointments_user_id_idx;
DROP INDEX IF EXISTS appointments_user_time_idx;

UPDATE clients
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

UPDATE services
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

UPDATE appointments
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- Clean up cross-user references: delete appointments that reference
-- a client or service belonging to a different user.
DELETE FROM appointments
WHERE id IN (
  SELECT a.id FROM appointments a
  JOIN clients c ON a.client_id = c.id
  WHERE a.user_id != c.user_id
)
OR id IN (
  SELECT a.id FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE a.user_id != s.user_id
);

CREATE TABLE clients_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO clients_new (id, user_id, name, first_name, last_name, email, phone, notes, created_at)
SELECT id, user_id, name, first_name, last_name, email, phone, notes, created_at
FROM clients;

ALTER TABLE clients RENAME TO clients_old;
ALTER TABLE clients_new RENAME TO clients;
DROP TABLE clients_old;

-- Use COALESCE so NULLs are treated as empty strings for uniqueness
CREATE UNIQUE INDEX clients_full_name_user_unique
ON clients(user_id, COALESCE(first_name, ''), COALESCE(last_name, ''));
CREATE INDEX clients_user_id_idx ON clients(user_id);

CREATE TABLE services_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO services_new (id, user_id, name, duration_minutes, price_cents, created_at)
SELECT id, user_id, name, duration_minutes, price_cents, created_at
FROM services;

ALTER TABLE services RENAME TO services_old;
ALTER TABLE services_new RENAME TO services;
DROP TABLE services_old;

CREATE INDEX services_user_id_idx ON services(user_id);

CREATE TABLE appointments_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id, user_id) REFERENCES clients(id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id, user_id) REFERENCES services(id, user_id) ON DELETE RESTRICT
);

INSERT INTO appointments_new (id, user_id, client_id, service_id, start_time, end_time, status, notes, created_at)
SELECT id, user_id, client_id, service_id, start_time, end_time, status, notes, created_at
FROM appointments;

ALTER TABLE appointments RENAME TO appointments_old;
ALTER TABLE appointments_new RENAME TO appointments;
DROP TABLE appointments_old;

CREATE INDEX appointments_user_id_idx ON appointments(user_id);
CREATE INDEX appointments_user_time_idx ON appointments(user_id, start_time, end_time);

PRAGMA foreign_keys=ON;
