import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import { logger } from "hono/logger";

import { db } from "./db/client";

const app = new Hono();
app.use(logger());

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const sessionCookieName = "planner_session";

const PASSWORD_MAX_BYTES = 72;

function hashSessionToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

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

function cleanupExpiredSessions() {
  db.query("DELETE FROM sessions WHERE expires_at <= strftime('%s','now')").run();
}

function getUserFromSession(token: string) {
  const tokenHash = hashSessionToken(token);
  return db
    .query(
      `SELECT users.id, users.name, users.email
       FROM sessions
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.token = ?
         AND sessions.expires_at > strftime('%s','now')
       LIMIT 1`
    )
    .get(tokenHash) as { id: string; name: string; email: string } | null;
}

function createSession(userId: string) {
  const token = crypto.randomUUID();
  const tokenHash = hashSessionToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  const sessionId = crypto.randomUUID();

  db.query(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
  ).run(sessionId, userId, tokenHash, expiresAt);

  return token;
}

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

  cleanupExpiredSessions();

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

  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });

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

  cleanupExpiredSessions();
  const token = createSession(createdUserId);

  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });

  return c.json({
    user: {
      id: createdUserId,
      name,
      email,
    },
  });
});

app.get("/api/auth/me", c => {
  const token = getCookie(c, sessionCookieName);
  if (!token) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  cleanupExpiredSessions();
  const user = getUserFromSession(token);
  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  return c.json({ user });
});

app.post("/api/auth/logout", c => {
  const token = getCookie(c, sessionCookieName);
  if (token) {
    db.query("DELETE FROM sessions WHERE token = ?").run(hashSessionToken(token));
  }

  setCookie(c, sessionCookieName, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });

  return c.json({ ok: true });
});

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API running on http://localhost:${port}`);
