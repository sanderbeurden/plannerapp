import type { Context } from "hono";
import { db } from "./db/client";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

const rateLimitStore = new Map<string, number[]>();

function pruneHits(hits: number[], now: number, windowMs: number) {
  return hits.filter((ts) => now - ts < windowMs);
}

export function isRateLimited(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = rateLimitStore.get(key) ?? [];
  const recent = pruneHits(existing, now, options.windowMs);

  if (recent.length >= options.max) {
    rateLimitStore.set(key, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
  return false;
}

export function getClientIp(c: Context) {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

export function logAuthFailure({
  userId,
  email,
  ip,
  reason,
}: {
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  reason: string;
}) {
  try {
    const id = crypto.randomUUID();
    db.query(
      "INSERT INTO auth_audit (id, user_id, email, ip, reason) VALUES (?, ?, ?, ?, ?)"
    ).run(id, userId ?? null, email ?? null, ip ?? null, reason);
  } catch {
    // Best-effort logging, ignore failures.
  }
}
