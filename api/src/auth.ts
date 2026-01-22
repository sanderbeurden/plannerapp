import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { db } from "./db/client";
import type { AppBindings, AuthUser } from "./models";

export const sessionCookieName = "planner_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

const isProd = process.env.NODE_ENV === "production";

function hashSessionToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

export function cleanupExpiredSessions() {
  db.query("DELETE FROM sessions WHERE expires_at <= strftime('%s','now')").run();
}

function findUserBySessionToken(token: string) {
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
    .get(tokenHash) as AuthUser | null;
}

export function createSession(userId: string) {
  const token = crypto.randomUUID();
  const tokenHash = hashSessionToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  const sessionId = crypto.randomUUID();

  db.query(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
  ).run(sessionId, userId, tokenHash, expiresAt);

  // Probabilistic cleanup (1% chance) to avoid write overhead on every request
  if (Math.random() < 0.01) {
    cleanupExpiredSessions();
  }

  return token;
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
}

export function clearSessionCookie(c: Context) {
  setCookie(c, sessionCookieName, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUser(c: Context) {
  const token = getCookie(c, sessionCookieName);
  if (!token) return null;
  return findUserBySessionToken(token);
}

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }
  c.set("user", user);
  await next();
};
