import type { Context } from "hono";

export function jsonOk<T>(c: Context, data: T) {
  return c.json({ data });
}

export function jsonCreated<T>(c: Context, data: T) {
  return c.json({ data }, 201);
}

export function jsonError(c: Context, message: string, status = 400) {
  return c.json({ error: message }, status);
}
