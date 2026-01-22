import { Hono } from "hono";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import { logger } from "hono/logger";

import {
  clearSessionCookie,
  createSession,
  getSessionUser,
  requireAuth,
  setSessionCookie,
} from "./auth";
import { db } from "./db/client";
import { jsonCreated, jsonError, jsonOk } from "./http";
import {
  mapAppointment,
  mapClient,
  mapService,
  type AppBindings,
  type AppointmentStatus,
} from "./models";
import {
  getOptionalInt,
  getOptionalString,
  getRequiredInt,
  getRequiredString,
  isValidIsoDate,
} from "./validation";

const app = new Hono<AppBindings>();
app.use(logger());

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const PASSWORD_MAX_BYTES = 72;

app.use(
  "/api/*",
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/api/health", c => {
  return c.json({ ok: true });
});

app.post("/api/auth/login", async c => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return c.json({ error: "Email and password required." }, 400);
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return c.json({ error: "Password too long." }, 400);
  }

  const user = db
    .query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1"
    )
    .get(email) as
    | { id: string; name: string; email: string; password_hash: string }
    | null;

  if (!user) {
    return c.json({ error: "Invalid credentials." }, 401);
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    return c.json({ error: "Invalid credentials." }, 401);
  }

  const token = createSession(user.id);
  setSessionCookie(c, token);

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post("/api/auth/signup", async c => {
  const body = await c.req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return c.json({ error: "Name, email, and password required." }, 400);
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return c.json({ error: "Password too long." }, 400);
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = crypto.randomUUID();

  const createOwner = db.transaction(() => {
    const existingCount = db
      .query("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    if (existingCount.count > 0) {
      return null;
    }

    db.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)"
    ).run(userId, name, email, passwordHash);

    return userId;
  });

  const createdUserId = createOwner.immediate();

  if (!createdUserId) {
    return c.json({ error: "Signup disabled for this workspace." }, 409);
  }

  const token = createSession(createdUserId);
  setSessionCookie(c, token);

  return c.json({
    user: {
      id: createdUserId,
      name,
      email,
    },
  });
});

app.get("/api/auth/me", c => {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  return c.json({ user });
});

app.post("/api/auth/logout", c => {
  const user = getSessionUser(c);
  if (user) {
    db.query("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  }

  clearSessionCookie(c);

  return c.json({ ok: true });
});

app.use("/api/clients", requireAuth);
app.use("/api/clients/*", requireAuth);
app.use("/api/services", requireAuth);
app.use("/api/services/*", requireAuth);
app.use("/api/appointments", requireAuth);
app.use("/api/appointments/*", requireAuth);

app.get("/api/clients", c => {
  const q = c.req.query("q")?.trim();
  let rows: unknown[];

  if (q) {
    // Escape SQL LIKE wildcards
    const escaped = q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const like = `%${escaped}%`;
    rows = db
      .query(
        "SELECT * FROM clients WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' ORDER BY name ASC"
      )
      .all(like, like);
  } else {
    rows = db.query("SELECT * FROM clients ORDER BY name ASC").all();
  }

  const clients = (rows as Parameters<typeof mapClient>[0][]).map(mapClient);
  return jsonOk(c, clients);
});

app.post("/api/clients", async c => {
  const body = await c.req.json().catch(() => null);
  const name = getRequiredString(body?.name);
  if (!name) {
    return jsonError(c, "Client name is required.");
  }

  const email = getOptionalString(body?.email);
  const phone = getOptionalString(body?.phone);
  const notes = getOptionalString(body?.notes);

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO clients (id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)"
  ).run(
    id,
    name,
    email ?? null,
    phone ?? null,
    notes ?? null
  );

  const row = db
    .query("SELECT * FROM clients WHERE id = ?")
    .get(id) as Parameters<typeof mapClient>[0];
  return jsonCreated(c, mapClient(row));
});

app.put("/api/clients/:id", async c => {
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM clients WHERE id = ?")
    .get(id) as Parameters<typeof mapClient>[0] | null;
  if (!existing) {
    return jsonError(c, "Client not found.", 404);
  }

  const body = await c.req.json().catch(() => null);
  const nameInput = getOptionalString(body?.name);
  const emailInput = getOptionalString(body?.email);
  const phoneInput = getOptionalString(body?.phone);
  const notesInput = getOptionalString(body?.notes);

  const name = nameInput === undefined ? existing.name : nameInput;
  if (!name) {
    return jsonError(c, "Client name is required.");
  }

  const email = emailInput === undefined ? existing.email : emailInput;
  const phone = phoneInput === undefined ? existing.phone : phoneInput;
  const notes = notesInput === undefined ? existing.notes : notesInput;

  db.query(
    "UPDATE clients SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ?"
  ).run(name, email, phone, notes, id);

  const row = db
    .query("SELECT * FROM clients WHERE id = ?")
    .get(id) as Parameters<typeof mapClient>[0];
  return jsonOk(c, mapClient(row));
});

app.delete("/api/clients/:id", c => {
  const id = c.req.param("id");
  const result = db.query("DELETE FROM clients WHERE id = ?").run(id);
  if (result.changes === 0) {
    return jsonError(c, "Client not found.", 404);
  }
  return jsonOk(c, { ok: true });
});

app.get("/api/services", c => {
  const rows = db.query("SELECT * FROM services ORDER BY name ASC").all();
  const services = (rows as Parameters<typeof mapService>[0][]).map(mapService);
  return jsonOk(c, services);
});

app.post("/api/services", async c => {
  const body = await c.req.json().catch(() => null);
  const name = getRequiredString(body?.name);
  const durationMinutes = getRequiredInt(body?.durationMinutes);
  const priceCents = getOptionalInt(body?.priceCents);

  if (!name) {
    return jsonError(c, "Service name is required.");
  }
  if (!durationMinutes || durationMinutes <= 0) {
    return jsonError(c, "Service duration must be a positive integer.");
  }
  if (priceCents !== undefined && priceCents !== null && priceCents < 0) {
    return jsonError(c, "Price cannot be negative.");
  }

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO services (id, name, duration_minutes, price_cents) VALUES (?, ?, ?, ?)"
  ).run(id, name, durationMinutes, priceCents ?? null);

  const row = db
    .query("SELECT * FROM services WHERE id = ?")
    .get(id) as Parameters<typeof mapService>[0];
  return jsonCreated(c, mapService(row));
});

app.put("/api/services/:id", async c => {
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM services WHERE id = ?")
    .get(id) as Parameters<typeof mapService>[0] | null;
  if (!existing) {
    return jsonError(c, "Service not found.", 404);
  }

  const body = await c.req.json().catch(() => null);
  const nameInput = getOptionalString(body?.name);
  const durationInput = getOptionalInt(body?.durationMinutes);
  const priceInput = getOptionalInt(body?.priceCents);

  const name = nameInput === undefined ? existing.name : nameInput;
  if (!name) {
    return jsonError(c, "Service name is required.");
  }

  const durationMinutes =
    durationInput === undefined ? existing.duration_minutes : durationInput;
  if (!durationMinutes || durationMinutes <= 0) {
    return jsonError(c, "Service duration must be a positive integer.");
  }

  const priceCents =
    priceInput === undefined ? existing.price_cents : priceInput;
  if (priceCents !== null && priceCents !== undefined && priceCents < 0) {
    return jsonError(c, "Price cannot be negative.");
  }

  db.query(
    "UPDATE services SET name = ?, duration_minutes = ?, price_cents = ? WHERE id = ?"
  ).run(name, durationMinutes, priceCents, id);

  const row = db
    .query("SELECT * FROM services WHERE id = ?")
    .get(id) as Parameters<typeof mapService>[0];
  return jsonOk(c, mapService(row));
});

app.delete("/api/services/:id", c => {
  const id = c.req.param("id");
  const result = db.query("DELETE FROM services WHERE id = ?").run(id);
  if (result.changes === 0) {
    return jsonError(c, "Service not found.", 404);
  }
  return jsonOk(c, { ok: true });
});

app.get("/api/appointments", c => {
  const fromParam = c.req.query("from");
  const toParam = c.req.query("to");

  if (!fromParam || !toParam) {
    return jsonError(c, "from and to query parameters are required.");
  }
  if (!isValidIsoDate(fromParam) || !isValidIsoDate(toParam)) {
    return jsonError(c, "from and to must be valid ISO timestamps.");
  }

  const from = new Date(fromParam).toISOString();
  const to = new Date(toParam).toISOString();

  const rows = db
    .query(
      `SELECT
        a.id,
        a.client_id,
        a.service_id,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.created_at,
        c.id as client_id_join,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.notes as client_notes,
        c.created_at as client_created_at,
        s.id as service_id_join,
        s.name as service_name,
        s.duration_minutes as service_duration_minutes,
        s.price_cents as service_price_cents,
        s.created_at as service_created_at
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       WHERE a.start_time < ? AND a.end_time > ?
       ORDER BY a.start_time ASC`
    )
    .all(to, from) as Array<{
      id: string;
      client_id: string;
      service_id: string;
      start_time: string;
      end_time: string;
      status: string;
      notes: string | null;
      created_at: string;
      client_name: string;
      client_email: string | null;
      client_phone: string | null;
      client_notes: string | null;
      client_created_at: string;
      service_name: string;
      service_duration_minutes: number;
      service_price_cents: number | null;
      service_created_at: string;
    }>;

  const appointments = rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    startUtc: row.start_time,
    endUtc: row.end_time,
    status: row.status as AppointmentStatus,
    notes: row.notes,
    createdAt: row.created_at,
    client: {
      id: row.client_id,
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
      notes: row.client_notes,
      createdAt: row.client_created_at,
    },
    service: {
      id: row.service_id,
      name: row.service_name,
      durationMinutes: row.service_duration_minutes,
      priceCents: row.service_price_cents,
      createdAt: row.service_created_at,
    },
  }));

  return jsonOk(c, appointments);
});

app.post("/api/appointments", async c => {
  const body = await c.req.json().catch(() => null);
  const clientId = getRequiredString(body?.clientId);
  const serviceId = getRequiredString(body?.serviceId);
  const startUtc = getRequiredString(body?.startUtc);
  const endUtc = getRequiredString(body?.endUtc);
  const notes = getOptionalString(body?.notes);
  const statusInput = getOptionalString(body?.status);
  const status = (statusInput ?? "confirmed") as AppointmentStatus;

  if (!clientId || !serviceId || !startUtc || !endUtc) {
    return jsonError(c, "clientId, serviceId, startUtc, and endUtc are required.");
  }
  if (!isValidIsoDate(startUtc) || !isValidIsoDate(endUtc)) {
    return jsonError(c, "startUtc and endUtc must be valid ISO timestamps.");
  }

  const startIso = new Date(startUtc).toISOString();
  const endIso = new Date(endUtc).toISOString();
  if (startIso >= endIso) {
    return jsonError(c, "End time must be after start time.");
  }

  if (!["confirmed", "hold", "cancelled"].includes(status)) {
    return jsonError(c, "Invalid status.");
  }

  const clientExists = db
    .query("SELECT id FROM clients WHERE id = ?")
    .get(clientId);
  if (!clientExists) {
    return jsonError(c, "Client not found.", 404);
  }

  const serviceExists = db
    .query("SELECT id FROM services WHERE id = ?")
    .get(serviceId);
  if (!serviceExists) {
    return jsonError(c, "Service not found.", 404);
  }

  const overlap = db
    .query(
      "SELECT id FROM appointments WHERE start_time < ? AND end_time > ? AND status != 'cancelled' LIMIT 1"
    )
    .get(endIso, startIso);
  if (overlap) {
    return jsonError(c, "Appointment overlaps an existing booking.", 409);
  }

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO appointments (id, client_id, service_id, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, clientId, serviceId, startIso, endIso, status, notes ?? null);

  const row = db
    .query("SELECT * FROM appointments WHERE id = ?")
    .get(id) as Parameters<typeof mapAppointment>[0];
  return jsonCreated(c, mapAppointment(row));
});

app.put("/api/appointments/:id", async c => {
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM appointments WHERE id = ?")
    .get(id) as Parameters<typeof mapAppointment>[0] | null;
  if (!existing) {
    return jsonError(c, "Appointment not found.", 404);
  }

  const body = await c.req.json().catch(() => null);
  const clientId =
    getOptionalString(body?.clientId) ?? existing.client_id;
  const serviceId =
    getOptionalString(body?.serviceId) ?? existing.service_id;
  const startUtcInput = getOptionalString(body?.startUtc);
  const endUtcInput = getOptionalString(body?.endUtc);
  const notesInput = getOptionalString(body?.notes);
  const statusInput = getOptionalString(body?.status);

  if (startUtcInput && !isValidIsoDate(startUtcInput)) {
    return jsonError(c, "startUtc must be a valid ISO timestamp.");
  }
  if (endUtcInput && !isValidIsoDate(endUtcInput)) {
    return jsonError(c, "endUtc must be a valid ISO timestamp.");
  }

  const startIso = startUtcInput
    ? new Date(startUtcInput).toISOString()
    : existing.start_time;
  const endIso = endUtcInput
    ? new Date(endUtcInput).toISOString()
    : existing.end_time;

  if (!isValidIsoDate(startIso) || !isValidIsoDate(endIso)) {
    return jsonError(c, "startUtc and endUtc must be valid ISO timestamps.");
  }
  if (startIso >= endIso) {
    return jsonError(c, "End time must be after start time.");
  }

  const status = (statusInput ?? existing.status) as AppointmentStatus;
  if (!["confirmed", "hold", "cancelled"].includes(status)) {
    return jsonError(c, "Invalid status.");
  }

  const clientExists = db
    .query("SELECT id FROM clients WHERE id = ?")
    .get(clientId);
  if (!clientExists) {
    return jsonError(c, "Client not found.", 404);
  }

  const serviceExists = db
    .query("SELECT id FROM services WHERE id = ?")
    .get(serviceId);
  if (!serviceExists) {
    return jsonError(c, "Service not found.", 404);
  }

  const overlap = db
    .query(
      "SELECT id FROM appointments WHERE id != ? AND start_time < ? AND end_time > ? AND status != 'cancelled' LIMIT 1"
    )
    .get(id, endIso, startIso);
  if (overlap) {
    return jsonError(c, "Appointment overlaps an existing booking.", 409);
  }

  const notes = notesInput === undefined ? existing.notes : notesInput;

  db.query(
    "UPDATE appointments SET client_id = ?, service_id = ?, start_time = ?, end_time = ?, status = ?, notes = ? WHERE id = ?"
  ).run(clientId, serviceId, startIso, endIso, status, notes, id);

  const row = db
    .query("SELECT * FROM appointments WHERE id = ?")
    .get(id) as Parameters<typeof mapAppointment>[0];
  return jsonOk(c, mapAppointment(row));
});

app.delete("/api/appointments/:id", c => {
  const id = c.req.param("id");
  const result = db.query("DELETE FROM appointments WHERE id = ?").run(id);
  if (result.changes === 0) {
    return jsonError(c, "Appointment not found.", 404);
  }
  return jsonOk(c, { ok: true });
});

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API running on http://localhost:${port}`);
