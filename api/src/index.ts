import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

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

  return c.json({
    token: "dev-token",
    user: {
      id: "owner-1",
      name: "Owner",
      email,
    },
  });
});

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API running on http://localhost:${port}`);
