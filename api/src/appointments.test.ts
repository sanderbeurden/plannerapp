import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";

const TEST_DB_PATH = `${tmpdir()}/plannerapp-test-${randomUUID()}.db`;
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = "test";

await import("./db/migrate");

const { db } = await import("./db/client");
const { app } = await import("./index");
const { createSession, sessionCookieName } = await import("./auth");

function cleanupDbFile(path: string) {
  rmSync(path, { force: true });
  rmSync(`${path}-wal`, { force: true });
  rmSync(`${path}-shm`, { force: true });
}

describe("appointments", () => {
  let cookie = "";
  let clientId = "";
  let serviceId = "";
  let userId = "";
  const headers = () => ({
    "Content-Type": "application/json",
    Cookie: cookie,
  });

  beforeAll(() => {
    userId = randomUUID();
    db.query(
      "INSERT INTO users (id, name, email, password_hash, email_verified_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, "Test User", "test@example.com", "hash", "2026-01-01T00:00:00Z");

    clientId = randomUUID();
    db.query(
      "INSERT INTO clients (id, user_id, name, first_name, last_name) VALUES (?, ?, ?, ?, ?)"
    ).run(clientId, userId, "Jane Doe", "Jane", "Doe");

    serviceId = randomUUID();
    db.query(
      "INSERT INTO services (id, user_id, name, duration_minutes, price_cents) VALUES (?, ?, ?, ?, ?)"
    ).run(serviceId, userId, "Haircut", 60, 5000);

    const token = createSession(userId);
    cookie = `${sessionCookieName}=${token}`;
  });

  afterAll(() => {
    db.close();
    cleanupDbFile(TEST_DB_PATH);
  });

  test("rejects overlapping appointments", async () => {
    const base = {
      clientId,
      serviceId,
      startUtc: "2026-01-29T10:00:00.000Z",
      endUtc: "2026-01-29T11:00:00.000Z",
    };

    const first = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(base),
    });
    expect(first.status).toBe(201);

    const overlap = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        ...base,
        startUtc: "2026-01-29T10:30:00.000Z",
        endUtc: "2026-01-29T11:30:00.000Z",
      }),
    });
    expect(overlap.status).toBe(409);
    const data = await overlap.json();
    expect(data).toMatchObject({
      error: "Appointment overlaps an existing booking.",
      code: "APPOINTMENT_OVERLAP",
    });
  });

  test("requires clientId, serviceId, startUtc, and endUtc", async () => {
    const res = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        clientId,
        serviceId,
        endUtc: "2026-01-29T11:00:00.000Z",
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toMatchObject({
      error: "clientId, serviceId, startUtc, and endUtc are required.",
      code: "APPOINTMENT_REQUIRED_FIELDS",
    });
  });

  test("rejects invalid ISO timestamps", async () => {
    const res = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        clientId,
        serviceId,
        startUtc: "not-a-date",
        endUtc: "2026-01-29T11:00:00.000Z",
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toMatchObject({
      error: "startUtc and endUtc must be valid ISO timestamps.",
      code: "APPOINTMENT_INVALID_TIME",
    });
  });

  test("rejects end time before start time", async () => {
    const res = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        clientId,
        serviceId,
        startUtc: "2026-01-29T12:00:00.000Z",
        endUtc: "2026-01-29T11:00:00.000Z",
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toMatchObject({
      error: "End time must be after start time.",
      code: "APPOINTMENT_END_BEFORE_START",
    });
  });

  test("requires authentication", async () => {
    const res = await app.request("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        serviceId,
        startUtc: "2026-02-02T09:00:00.000Z",
        endUtc: "2026-02-02T10:00:00.000Z",
      }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toMatchObject({ error: "Unauthorized." });
  });

  test("creates and fetches appointments in UTC", async () => {
    const startUtc = "2026-02-02T09:00:00.000Z";
    const endUtc = "2026-02-02T10:00:00.000Z";

    const created = await app.request("/api/appointments", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        clientId,
        serviceId,
        startUtc,
        endUtc,
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.data).toMatchObject({
      clientId,
      serviceId,
      startUtc,
      endUtc,
    });

    const fetched = await app.request(
      `/api/appointments?from=2026-02-02T00:00:00.000Z&to=2026-02-03T00:00:00.000Z`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    );
    expect(fetched.status).toBe(200);
    const fetchedBody = await fetched.json();
    expect(Array.isArray(fetchedBody.data)).toBe(true);
    const match = fetchedBody.data.find((item: { id: string }) =>
      item.id === createdBody.data.id
    );
    expect(match).toMatchObject({
      clientId,
      serviceId,
      startUtc,
      endUtc,
    });
  });
});
