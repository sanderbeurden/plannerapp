ALTER TABLE clients ADD COLUMN first_name TEXT;
ALTER TABLE clients ADD COLUMN last_name TEXT;

UPDATE clients
SET first_name = trim(
      CASE
        WHEN instr(name, ' ') > 0 THEN substr(name, 1, instr(name, ' ') - 1)
        ELSE name
      END
    ),
    last_name = trim(
      CASE
        WHEN instr(name, ' ') > 0 THEN substr(name, instr(name, ' ') + 1)
        ELSE ''
      END
    )
WHERE first_name IS NULL OR last_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_full_name_unique
ON clients(first_name, last_name);
