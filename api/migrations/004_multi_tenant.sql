ALTER TABLE clients ADD COLUMN user_id TEXT;
ALTER TABLE services ADD COLUMN user_id TEXT;
ALTER TABLE appointments ADD COLUMN user_id TEXT;

UPDATE clients
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

UPDATE services
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

UPDATE appointments
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

DROP INDEX IF EXISTS clients_full_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS clients_full_name_user_unique
ON clients(user_id, first_name, last_name);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS services_user_id_idx ON services(user_id);
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_user_time_idx ON appointments(user_id, start_time, end_time);
