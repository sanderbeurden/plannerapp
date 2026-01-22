# API Plan (MVP)

## Goals
- Single-owner planner API with session auth.
- CRUD for clients, services, appointments.
- All time stored in UTC (ISO-8601 strings); validate overlaps server-side.

## Conventions
- Base path: `/api`
- Auth via HttpOnly cookie `planner_session`.
- JSON responses: `{ data: ... }` on success, `{ error: "message" }` on failure.
- Status codes: 200/201 for success, 400 for validation, 401 for auth, 404 for missing, 409 for conflicts.

## Auth
- `POST /api/auth/signup` (first owner only)
  - Body: `{ name, email, password }`
  - Response: `{ user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user }`
- `POST /api/auth/logout`
  - Response: `{ ok: true }`
- `GET /api/auth/me`
  - Response: `{ user }`

## Clients
- `GET /api/clients`
  - Optional: `?q=` for name search
- `POST /api/clients`
  - Body: `{ name, email?, phone?, notes? }`
- `PUT /api/clients/:id`
  - Body: same as create
- `DELETE /api/clients/:id`

## Services
- `GET /api/services`
- `POST /api/services`
  - Body: `{ name, durationMinutes, priceCents? }`
- `PUT /api/services/:id`
- `DELETE /api/services/:id`

## Appointments
- `GET /api/appointments?from=ISO&to=ISO`
  - Range required; return list sorted by start time.
- `POST /api/appointments`
  - Body: `{ clientId, serviceId, startUtc, endUtc, notes?, status? }`
  - Validate: end > start; no overlap.
- `PUT /api/appointments/:id`
  - Same body; re-check overlap.
- `DELETE /api/appointments/:id`

## Validation Rules
- Require auth for all non-auth routes.
- Overlap check: any appointment where `start < newEnd AND end > newStart`.
- Status enum: `confirmed | hold | cancelled`.

## Implementation Order
1) Add auth middleware + error helpers.
2) Build Clients CRUD.
3) Build Services CRUD.
4) Build Appointments CRUD + overlap validation.
