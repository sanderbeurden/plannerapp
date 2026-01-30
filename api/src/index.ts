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
import { getClientIp, isRateLimited, logAuthFailure } from "./security";
import { hashToken } from "./auth";
import { sendEmail } from "./email";
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

export const app = new Hono<AppBindings>();
app.use(logger());

const port = Number(process.env.PORT ?? 3001);
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const PASSWORD_MAX_BYTES = 72;
const EMAIL_VERIFY_EXPIRES_HOURS = 24;
const PASSWORD_RESET_EXPIRES_HOURS = 2;
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:5173";

function validateEnvironment() {
  const missing = [];
  if (!process.env.CORS_ORIGIN) missing.push("CORS_ORIGIN");
  if (!process.env.APP_BASE_URL) missing.push("APP_BASE_URL");
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!process.env.RESEND_FROM) missing.push("RESEND_FROM");

  if (missing.length > 0) {
    const message = `[env] Missing ${missing.join(
      ", "
    )}. Email delivery may fail and defaults may be unsafe in production.`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.warn(message);
  }
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  }
  return lines.join("\n");
}

function createTokenWithExpiry(hours: number) {
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + hours * 60 * 60;
  return { token, tokenHash, expiresAt };
}

validateEnvironment();

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return corsOrigins[0] ?? "";
      return corsOrigins.includes(origin) ? origin : undefined;
    },
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
  const ip = getClientIp(c);
  const emailKey = email.trim().toLowerCase();

  if (
    isRateLimited(`auth:login:ip:${ip}`, { windowMs: 10 * 60 * 1000, max: 30 }) ||
    (emailKey &&
      isRateLimited(`auth:login:${ip}:${emailKey}`, { windowMs: 10 * 60 * 1000, max: 8 }))
  ) {
    return jsonError(c, "Too many requests. Please try again later.", 429, "RATE_LIMIT");
  }

  if (!email || !password) {
    return jsonError(c, "Email and password required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return jsonError(c, "Password too long.", 400, "AUTH_PASSWORD_TOO_LONG");
  }

  const user = db
    .query(
      "SELECT id, name, email, password_hash, email_verified_at FROM users WHERE email = ? LIMIT 1"
    )
    .get(email) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        email_verified_at: string | null;
      }
    | null;

  if (!user) {
    logAuthFailure({ email: emailKey, ip, reason: "invalid_credentials" });
    return jsonError(c, "Invalid credentials.", 401, "AUTH_INVALID_CREDENTIALS");
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatches) {
    logAuthFailure({ userId: user.id, email: emailKey, ip, reason: "invalid_credentials" });
    return jsonError(c, "Invalid credentials.", 401, "AUTH_INVALID_CREDENTIALS");
  }

  if (!user.email_verified_at) {
    logAuthFailure({ userId: user.id, email: emailKey, ip, reason: "email_unverified" });
    return jsonError(c, "Email not verified.", 403, "AUTH_EMAIL_NOT_VERIFIED");
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
  const ip = getClientIp(c);
  const emailKey = email.toLowerCase();

  if (
    isRateLimited(`auth:signup:ip:${ip}`, { windowMs: 10 * 60 * 1000, max: 20 }) ||
    (emailKey &&
      isRateLimited(`auth:signup:${ip}:${emailKey}`, { windowMs: 10 * 60 * 1000, max: 5 }))
  ) {
    return jsonError(c, "Too many requests. Please try again later.", 429, "RATE_LIMIT");
  }

  if (!name || !email || !password) {
    return jsonError(c, "Name, email, and password required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return jsonError(c, "Password too long.", 400, "AUTH_PASSWORD_TOO_LONG");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = crypto.randomUUID();

  try {
    db.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)"
    ).run(userId, name, email, passwordHash);
  } catch (err) {
    logAuthFailure({ email: emailKey, ip, reason: "email_exists" });
    return jsonError(c, "Email already exists.", 409, "AUTH_EMAIL_EXISTS");
  }

  const verification = createTokenWithExpiry(EMAIL_VERIFY_EXPIRES_HOURS);
  db.query(
    "INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
  ).run(crypto.randomUUID(), userId, verification.tokenHash, verification.expiresAt);

  const verifyLink = `${APP_BASE_URL}/verify?token=${verification.token}`;
  try {
    await sendEmail({
      to: email,
      subject: "Verify your Sjedule account",
      text: `Click to verify your email: ${verifyLink}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return jsonError(c, "Failed to send verification email.", 502, "AUTH_EMAIL_SEND_FAILED");
  }

  return c.json({ ok: true, verificationRequired: true });
});

app.get("/api/auth/me", c => {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  return c.json({ user });
});

app.post("/api/auth/verify", async c => {
  const body = await c.req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) {
    return jsonError(c, "Token is required.", 400, "AUTH_TOKEN_REQUIRED");
  }

  const tokenHash = hashToken(token);
  const row = db
    .query(
      "SELECT user_id, expires_at FROM email_verification_tokens WHERE token_hash = ? LIMIT 1"
    )
    .get(tokenHash) as { user_id: string; expires_at: number } | null;

  if (!row || row.expires_at <= Math.floor(Date.now() / 1000)) {
    return jsonError(c, "Invalid or expired token.", 400, "AUTH_TOKEN_INVALID");
  }

  db.query("UPDATE users SET email_verified_at = datetime('now') WHERE id = ?")
    .run(row.user_id);
  db.query("DELETE FROM email_verification_tokens WHERE user_id = ?").run(row.user_id);

  return jsonOk(c, { ok: true });
});

app.post("/api/auth/verify/resend", async c => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const ip = getClientIp(c);
  const emailKey = email.toLowerCase();

  if (!email) {
    return jsonError(c, "Email is required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (
    isRateLimited(`auth:verify:ip:${ip}`, { windowMs: 10 * 60 * 1000, max: 20 }) ||
    (emailKey &&
      isRateLimited(`auth:verify:${ip}:${emailKey}`, { windowMs: 10 * 60 * 1000, max: 5 }))
  ) {
    return jsonError(c, "Too many requests. Please try again later.", 429, "RATE_LIMIT");
  }

  const user = db
    .query(
      "SELECT id, email_verified_at FROM users WHERE email = ? LIMIT 1"
    )
    .get(email) as { id: string; email_verified_at: string | null } | null;

  if (!user || user.email_verified_at) {
    return jsonOk(c, { ok: true });
  }

  db.query("DELETE FROM email_verification_tokens WHERE user_id = ?").run(user.id);
  const verification = createTokenWithExpiry(EMAIL_VERIFY_EXPIRES_HOURS);
  db.query(
    "INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
  ).run(crypto.randomUUID(), user.id, verification.tokenHash, verification.expiresAt);

  const verifyLink = `${APP_BASE_URL}/verify?token=${verification.token}`;
  try {
    await sendEmail({
      to: email,
      subject: "Verify your Sjedule account",
      text: `Click to verify your email: ${verifyLink}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return jsonError(c, "Failed to send verification email.", 502, "AUTH_EMAIL_SEND_FAILED");
  }

  return jsonOk(c, { ok: true });
});

app.post("/api/auth/password-reset/request", async c => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const ip = getClientIp(c);
  const emailKey = email.toLowerCase();

  if (!email) {
    return jsonError(c, "Email is required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (
    isRateLimited(`auth:reset:ip:${ip}`, { windowMs: 10 * 60 * 1000, max: 20 }) ||
    (emailKey &&
      isRateLimited(`auth:reset:${ip}:${emailKey}`, { windowMs: 10 * 60 * 1000, max: 5 }))
  ) {
    return jsonError(c, "Too many requests. Please try again later.", 429, "RATE_LIMIT");
  }

  const user = db
    .query("SELECT id, email_verified_at FROM users WHERE email = ? LIMIT 1")
    .get(email) as { id: string; email_verified_at: string | null } | null;

  if (!user || !user.email_verified_at) {
    return jsonOk(c, { ok: true });
  }

  db.query("DELETE FROM password_reset_tokens WHERE user_id = ?").run(user.id);
  const reset = createTokenWithExpiry(PASSWORD_RESET_EXPIRES_HOURS);
  db.query(
    "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
  ).run(crypto.randomUUID(), user.id, reset.tokenHash, reset.expiresAt);

  const resetLink = `${APP_BASE_URL}/reset/confirm?token=${reset.token}`;
  try {
    await sendEmail({
      to: email,
      subject: "Reset your Sjedule password",
      text: `Click to reset your password: ${resetLink}`,
      html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err);
    return jsonError(c, "Failed to send reset email.", 502, "AUTH_EMAIL_SEND_FAILED");
  }

  return jsonOk(c, { ok: true });
});

app.post("/api/auth/password-reset/confirm", async c => {
  const body = await c.req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !password) {
    return jsonError(c, "Token and password are required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return jsonError(c, "Password too long.", 400, "AUTH_PASSWORD_TOO_LONG");
  }

  const tokenHash = hashToken(token);
  const row = db
    .query(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = ?
       LIMIT 1`
    )
    .get(tokenHash) as { user_id: string; expires_at: number; used_at: string | null } | null;

  if (!row || row.used_at || row.expires_at <= Math.floor(Date.now() / 1000)) {
    return jsonError(c, "Invalid or expired token.", 400, "AUTH_TOKEN_INVALID");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.query("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, row.user_id);
  db.query(
    "UPDATE password_reset_tokens SET used_at = datetime('now') WHERE token_hash = ?"
  ).run(tokenHash);
  db.query("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);

  return jsonOk(c, { ok: true });
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
app.use("/api/exports", requireAuth);
app.use("/api/exports/*", requireAuth);
app.use("/api/account", requireAuth);
app.use("/api/account/*", requireAuth);

app.get("/api/clients", c => {
  const user = c.get("user");
  const q = c.req.query("q")?.trim();
  let rows: unknown[];

  if (q) {
    // Escape SQL LIKE wildcards
    const escaped = q
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
    const like = `%${escaped}%`;
    rows = db
      .query(
        `SELECT * FROM clients
         WHERE user_id = ?
           AND (first_name LIKE ? ESCAPE '\\'
             OR last_name LIKE ? ESCAPE '\\'
             OR (first_name || ' ' || last_name) LIKE ? ESCAPE '\\'
             OR email LIKE ? ESCAPE '\\')
         ORDER BY first_name ASC, last_name ASC`
      )
      .all(user.id, like, like, like, like);
  } else {
    rows = db
      .query(
        "SELECT * FROM clients WHERE user_id = ? ORDER BY first_name ASC, last_name ASC"
      )
      .all(user.id);
  }

  const clients = (rows as Parameters<typeof mapClient>[0][]).map(mapClient);
  return jsonOk(c, clients);
});

app.post("/api/clients", async c => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const firstName = getRequiredString(body?.firstName);
  const lastName = getRequiredString(body?.lastName);
  if (!firstName || !lastName) {
    return jsonError(c, "Client firstName and lastName are required.", 400, "CLIENT_NAME_REQUIRED");
  }

  const email = getOptionalString(body?.email);
  const phone = getOptionalString(body?.phone);
  const notes = getOptionalString(body?.notes);

  const existing = db
    .query(
      "SELECT id FROM clients WHERE user_id = ? AND first_name = ? AND last_name = ? LIMIT 1"
    )
    .get(user.id, firstName, lastName);
  if (existing) {
    return jsonError(c, "Client with this name already exists.", 409, "CLIENT_DUPLICATE");
  }

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO clients (id, user_id, name, first_name, last_name, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    user.id,
    `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email ?? null,
    phone ?? null,
    notes ?? null
  );

  const row = db
    .query("SELECT * FROM clients WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapClient>[0];
  return jsonCreated(c, mapClient(row));
});

app.put("/api/clients/:id", async c => {
  const user = c.get("user");
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM clients WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapClient>[0] | null;
  if (!existing) {
    return jsonError(c, "Client not found.", 404, "CLIENT_NOT_FOUND");
  }

  const body = await c.req.json().catch(() => null);
  const firstNameInput = getOptionalString(body?.firstName);
  const lastNameInput = getOptionalString(body?.lastName);
  const emailInput = getOptionalString(body?.email);
  const phoneInput = getOptionalString(body?.phone);
  const notesInput = getOptionalString(body?.notes);

  const firstName =
    firstNameInput === undefined ? existing.first_name : firstNameInput;
  const lastName =
    lastNameInput === undefined ? existing.last_name : lastNameInput;

  if (!firstName || !lastName) {
    return jsonError(c, "Client firstName and lastName are required.", 400, "CLIENT_NAME_REQUIRED");
  }

  const email = emailInput === undefined ? existing.email : emailInput;
  const phone = phoneInput === undefined ? existing.phone : phoneInput;
  const notes = notesInput === undefined ? existing.notes : notesInput;

  const duplicate = db
    .query(
      "SELECT id FROM clients WHERE id != ? AND user_id = ? AND first_name = ? AND last_name = ? LIMIT 1"
    )
    .get(id, user.id, firstName, lastName);
  if (duplicate) {
    return jsonError(c, "Client with this name already exists.", 409, "CLIENT_DUPLICATE");
  }

  db.query(
    "UPDATE clients SET name = ?, first_name = ?, last_name = ?, email = ?, phone = ?, notes = ? WHERE id = ? AND user_id = ?"
  ).run(
    `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email,
    phone,
    notes,
    id,
    user.id
  );

  const row = db
    .query("SELECT * FROM clients WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapClient>[0];
  return jsonOk(c, mapClient(row));
});

app.delete("/api/clients/:id", c => {
  const user = c.get("user");
  const id = c.req.param("id");

  // Check if client has appointments
  const hasAppointments = db
    .query("SELECT id FROM appointments WHERE client_id = ? AND user_id = ? LIMIT 1")
    .get(id, user.id);
  if (hasAppointments) {
    return jsonError(
      c,
      "Cannot delete client with existing appointments.",
      409,
      "CLIENT_HAS_APPOINTMENTS"
    );
  }

  const result = db
    .query("DELETE FROM clients WHERE id = ? AND user_id = ?")
    .run(id, user.id);
  if (result.changes === 0) {
    return jsonError(c, "Client not found.", 404, "CLIENT_NOT_FOUND");
  }
  return jsonOk(c, { ok: true });
});

app.get("/api/services", c => {
  const user = c.get("user");
  const rows = db
    .query("SELECT * FROM services WHERE user_id = ? ORDER BY name ASC")
    .all(user.id);
  const services = (rows as Parameters<typeof mapService>[0][]).map(mapService);
  return jsonOk(c, services);
});

app.post("/api/services", async c => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const name = getRequiredString(body?.name);
  const durationMinutes = getRequiredInt(body?.durationMinutes);
  const priceCents = getOptionalInt(body?.priceCents);

  if (!name) {
    return jsonError(c, "Service name is required.", 400, "SERVICE_NAME_REQUIRED");
  }
  if (!durationMinutes || durationMinutes <= 0) {
    return jsonError(
      c,
      "Service duration must be a positive integer.",
      400,
      "SERVICE_DURATION_INVALID"
    );
  }
  if (priceCents !== undefined && priceCents !== null && priceCents < 0) {
    return jsonError(c, "Price cannot be negative.", 400, "SERVICE_PRICE_INVALID");
  }

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO services (id, user_id, name, duration_minutes, price_cents) VALUES (?, ?, ?, ?, ?)"
  ).run(id, user.id, name, durationMinutes, priceCents ?? null);

  const row = db
    .query("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapService>[0];
  return jsonCreated(c, mapService(row));
});

app.put("/api/services/:id", async c => {
  const user = c.get("user");
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapService>[0] | null;
  if (!existing) {
    return jsonError(c, "Service not found.", 404, "SERVICE_NOT_FOUND");
  }

  const body = await c.req.json().catch(() => null);
  const nameInput = getOptionalString(body?.name);
  const durationInput = getOptionalInt(body?.durationMinutes);
  const priceInput = getOptionalInt(body?.priceCents);

  const name = nameInput === undefined ? existing.name : nameInput;
  if (!name) {
    return jsonError(c, "Service name is required.", 400, "SERVICE_NAME_REQUIRED");
  }

  const durationMinutes =
    durationInput === undefined ? existing.duration_minutes : durationInput;
  if (!durationMinutes || durationMinutes <= 0) {
    return jsonError(
      c,
      "Service duration must be a positive integer.",
      400,
      "SERVICE_DURATION_INVALID"
    );
  }

  const priceCents =
    priceInput === undefined ? existing.price_cents : priceInput;
  if (priceCents !== null && priceCents !== undefined && priceCents < 0) {
    return jsonError(c, "Price cannot be negative.", 400, "SERVICE_PRICE_INVALID");
  }

  db.query(
    "UPDATE services SET name = ?, duration_minutes = ?, price_cents = ? WHERE id = ? AND user_id = ?"
  ).run(name, durationMinutes, priceCents, id, user.id);

  const row = db
    .query("SELECT * FROM services WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapService>[0];
  return jsonOk(c, mapService(row));
});

app.delete("/api/services/:id", c => {
  const user = c.get("user");
  const id = c.req.param("id");
  const result = db
    .query("DELETE FROM services WHERE id = ? AND user_id = ?")
    .run(id, user.id);
  if (result.changes === 0) {
    return jsonError(c, "Service not found.", 404, "SERVICE_NOT_FOUND");
  }
  return jsonOk(c, { ok: true });
});

app.get("/api/appointments", c => {
  const user = c.get("user");
  const fromParam = c.req.query("from");
  const toParam = c.req.query("to");

  if (!fromParam || !toParam) {
    return jsonError(c, "from and to query parameters are required.", 400, "APPOINTMENT_RANGE_REQUIRED");
  }
  if (!isValidIsoDate(fromParam) || !isValidIsoDate(toParam)) {
    return jsonError(c, "from and to must be valid ISO timestamps.", 400, "APPOINTMENT_RANGE_INVALID");
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
        c.first_name as client_first_name,
        c.last_name as client_last_name,
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
       JOIN clients c ON a.client_id = c.id AND c.user_id = a.user_id
       JOIN services s ON a.service_id = s.id AND s.user_id = a.user_id
       WHERE a.user_id = ?
         AND a.start_time < ? AND a.end_time > ?
       ORDER BY a.start_time ASC`
    )
    .all(user.id, to, from) as Array<{
      id: string;
      client_id: string;
      service_id: string;
      start_time: string;
      end_time: string;
      status: string;
      notes: string | null;
      created_at: string;
      client_first_name: string;
      client_last_name: string;
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
      firstName: row.client_first_name,
      lastName: row.client_last_name,
      fullName: `${row.client_first_name} ${row.client_last_name}`,
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
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const clientId = getRequiredString(body?.clientId);
  const serviceId = getRequiredString(body?.serviceId);
  const startUtc = getRequiredString(body?.startUtc);
  const endUtc = getRequiredString(body?.endUtc);
  const notes = getOptionalString(body?.notes);
  const statusInput = getOptionalString(body?.status);
  const status = (statusInput ?? "confirmed") as AppointmentStatus;

  if (!clientId || !serviceId || !startUtc || !endUtc) {
    return jsonError(
      c,
      "clientId, serviceId, startUtc, and endUtc are required.",
      400,
      "APPOINTMENT_REQUIRED_FIELDS"
    );
  }
  if (!isValidIsoDate(startUtc) || !isValidIsoDate(endUtc)) {
    return jsonError(
      c,
      "startUtc and endUtc must be valid ISO timestamps.",
      400,
      "APPOINTMENT_INVALID_TIME"
    );
  }

  const startIso = new Date(startUtc).toISOString();
  const endIso = new Date(endUtc).toISOString();
  if (startIso >= endIso) {
    return jsonError(
      c,
      "End time must be after start time.",
      400,
      "APPOINTMENT_END_BEFORE_START"
    );
  }

  if (!["confirmed", "hold", "cancelled"].includes(status)) {
    return jsonError(c, "Invalid status.", 400, "APPOINTMENT_INVALID_STATUS");
  }

  const clientExists = db
    .query("SELECT id FROM clients WHERE id = ? AND user_id = ?")
    .get(clientId, user.id);
  if (!clientExists) {
    return jsonError(c, "Client not found.", 404, "CLIENT_NOT_FOUND");
  }

  const serviceExists = db
    .query("SELECT id FROM services WHERE id = ? AND user_id = ?")
    .get(serviceId, user.id);
  if (!serviceExists) {
    return jsonError(c, "Service not found.", 404, "SERVICE_NOT_FOUND");
  }

  const overlap = db
    .query(
      "SELECT id FROM appointments WHERE user_id = ? AND start_time < ? AND end_time > ? AND status != 'cancelled' LIMIT 1"
    )
    .get(user.id, endIso, startIso);
  if (overlap) {
    return jsonError(c, "Appointment overlaps an existing booking.", 409, "APPOINTMENT_OVERLAP");
  }

  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO appointments (id, user_id, client_id, service_id, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, user.id, clientId, serviceId, startIso, endIso, status, notes ?? null);

  const row = db
    .query("SELECT * FROM appointments WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapAppointment>[0];
  return jsonCreated(c, mapAppointment(row));
});

app.put("/api/appointments/:id", async c => {
  const user = c.get("user");
  const id = c.req.param("id");
  const existing = db
    .query("SELECT * FROM appointments WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapAppointment>[0] | null;
  if (!existing) {
    return jsonError(c, "Appointment not found.", 404, "APPOINTMENT_NOT_FOUND");
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
    return jsonError(c, "startUtc must be a valid ISO timestamp.", 400, "APPOINTMENT_INVALID_TIME");
  }
  if (endUtcInput && !isValidIsoDate(endUtcInput)) {
    return jsonError(c, "endUtc must be a valid ISO timestamp.", 400, "APPOINTMENT_INVALID_TIME");
  }

  const startIso = startUtcInput
    ? new Date(startUtcInput).toISOString()
    : existing.start_time;
  const endIso = endUtcInput
    ? new Date(endUtcInput).toISOString()
    : existing.end_time;

  if (!isValidIsoDate(startIso) || !isValidIsoDate(endIso)) {
    return jsonError(
      c,
      "startUtc and endUtc must be valid ISO timestamps.",
      400,
      "APPOINTMENT_INVALID_TIME"
    );
  }
  if (startIso >= endIso) {
    return jsonError(
      c,
      "End time must be after start time.",
      400,
      "APPOINTMENT_END_BEFORE_START"
    );
  }

  const status = (statusInput ?? existing.status) as AppointmentStatus;
  if (!["confirmed", "hold", "cancelled"].includes(status)) {
    return jsonError(c, "Invalid status.", 400, "APPOINTMENT_INVALID_STATUS");
  }

  const clientExists = db
    .query("SELECT id FROM clients WHERE id = ? AND user_id = ?")
    .get(clientId, user.id);
  if (!clientExists) {
    return jsonError(c, "Client not found.", 404, "CLIENT_NOT_FOUND");
  }

  const serviceExists = db
    .query("SELECT id FROM services WHERE id = ? AND user_id = ?")
    .get(serviceId, user.id);
  if (!serviceExists) {
    return jsonError(c, "Service not found.", 404, "SERVICE_NOT_FOUND");
  }

  const overlap = db
    .query(
      "SELECT id FROM appointments WHERE id != ? AND user_id = ? AND start_time < ? AND end_time > ? AND status != 'cancelled' LIMIT 1"
    )
    .get(id, user.id, endIso, startIso);
  if (overlap) {
    return jsonError(c, "Appointment overlaps an existing booking.", 409, "APPOINTMENT_OVERLAP");
  }

  const notes = notesInput === undefined ? existing.notes : notesInput;

  db.query(
    "UPDATE appointments SET client_id = ?, service_id = ?, start_time = ?, end_time = ?, status = ?, notes = ? WHERE id = ? AND user_id = ?"
  ).run(clientId, serviceId, startIso, endIso, status, notes, id, user.id);

  const row = db
    .query("SELECT * FROM appointments WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Parameters<typeof mapAppointment>[0];
  return jsonOk(c, mapAppointment(row));
});

app.delete("/api/appointments/:id", c => {
  const user = c.get("user");
  const id = c.req.param("id");
  const result = db
    .query("DELETE FROM appointments WHERE id = ? AND user_id = ?")
    .run(id, user.id);
  if (result.changes === 0) {
    return jsonError(c, "Appointment not found.", 404, "APPOINTMENT_NOT_FOUND");
  }
  return jsonOk(c, { ok: true });
});

app.get("/api/exports/clients", c => {
  const user = c.get("user");
  const rows = db
    .query(
      `SELECT first_name, last_name, email, phone, notes, created_at
       FROM clients
       WHERE user_id = ?
       ORDER BY first_name ASC, last_name ASC`
    )
    .all(user.id) as Record<string, unknown>[];

  const headers = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "notes",
    "created_at",
  ];
  const csv = toCsv(rows, headers);
  const filename = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  return c.text(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
});

app.get("/api/exports/appointments", c => {
  const user = c.get("user");
  const rows = db
    .query(
      `SELECT
         a.start_time,
         a.end_time,
         a.status,
         a.notes,
         a.created_at,
         c.first_name as client_first_name,
         c.last_name as client_last_name,
         s.name as service_name,
         s.duration_minutes as service_duration_minutes,
         s.price_cents as service_price_cents
       FROM appointments a
       JOIN clients c ON a.client_id = c.id AND c.user_id = a.user_id
       JOIN services s ON a.service_id = s.id AND s.user_id = a.user_id
       WHERE a.user_id = ?
       ORDER BY a.start_time ASC`
    )
    .all(user.id) as Record<string, unknown>[];

  const headers = [
    "start_time",
    "end_time",
    "status",
    "notes",
    "created_at",
    "client_first_name",
    "client_last_name",
    "service_name",
    "service_duration_minutes",
    "service_price_cents",
  ];
  const csv = toCsv(rows, headers);
  const filename = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
  return c.text(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
});

app.post("/api/account/delete", async c => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const ip = getClientIp(c);

  if (
    isRateLimited(`auth:delete:ip:${ip}`, { windowMs: 10 * 60 * 1000, max: 10 }) ||
    isRateLimited(`auth:delete:user:${user.id}`, { windowMs: 10 * 60 * 1000, max: 5 })
  ) {
    return jsonError(c, "Too many requests. Please try again later.", 429, "RATE_LIMIT");
  }

  if (!password) {
    return jsonError(c, "Password is required.", 400, "AUTH_REQUIRED_FIELDS");
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return jsonError(c, "Password too long.", 400, "AUTH_PASSWORD_TOO_LONG");
  }

  const existing = db
    .query("SELECT password_hash FROM users WHERE id = ? LIMIT 1")
    .get(user.id) as { password_hash: string } | null;

  if (!existing || !bcrypt.compareSync(password, existing.password_hash)) {
    return jsonError(c, "Invalid credentials.", 401, "AUTH_INVALID_CREDENTIALS");
  }

  db.query("DELETE FROM users WHERE id = ?").run(user.id);
  clearSessionCookie(c);
  return jsonOk(c, { ok: true });
});

if (process.env.NODE_ENV !== "test") {
  Bun.serve({
    port,
    fetch: app.fetch,
  });

  console.log(`API running on http://localhost:${port}`);
}
