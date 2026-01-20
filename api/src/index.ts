import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";

import { db } from "./db/client";

const app = new Hono();

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required in production");
}
const effectiveJwtSecret = jwtSecret ?? "dev-secret-change-in-production";

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

  const token = await sign(
    {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    effectiveJwtSecret
  );

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API running on http://localhost:${port}`);
