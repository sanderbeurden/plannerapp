# Planner App MVP Plan

## Product Goal
Build a React SPA + Hono backend for a single salon owner (beautician/barber) to log in and manage appointments. Store all timestamps in UTC and render in the user’s local browser time.

## Scope (MVP)
- Auth: owner login, session-based access
- Calendar: day/week view with time slots
- Appointments: create/edit/delete with service + customer
- Customers: basic list + CRUD
- Services: basic list + CRUD (duration + price)
- Validation: prevent overlapping appointments

## Non-Goals (MVP)
- Payments, reminders, staff roles, analytics

## Architecture
- Frontend: React SPA, client-side routing
- Backend: Hono API server running on Bun
- Database: SQLite for MVP (single owner, local or hosted file)
- Auth: session cookie (HTTP-only) + server-side session store

## Data Model (UTC stored)
- User: id, email, password_hash, created_at
- Customer: id, name, phone, email, notes, created_at
- Service: id, name, duration_min, price, created_at
- Appointment: id, customer_id, service_id, start_utc, end_utc, notes, created_at

## API Design (Hono)
- Auth
  - POST /auth/login
  - POST /auth/logout
  - GET /auth/me
- Customers
  - GET /customers
  - POST /customers
  - PUT /customers/:id
  - DELETE /customers/:id
- Services
  - GET /services
  - POST /services
  - PUT /services/:id
  - DELETE /services/:id
- Appointments
  - GET /appointments?from=...&to=...
  - POST /appointments
  - PUT /appointments/:id
  - DELETE /appointments/:id

## Timezone Handling
- Store `start_utc` and `end_utc` as ISO-8601 UTC strings.
- Server validates overlap using UTC values.
- Client converts UTC strings to local time for display.

## Frontend UX (MVP)
- Login screen
- Calendar view (day/week) with list/grid toggle
- Appointment modal: customer, service, date, start time, duration, notes
- Settings for managing customers and services

## Validation Rules
- No overlapping appointments for the owner
- Appointments must have valid customer + service
- End time must be after start time

## Milestones
1) Backend skeleton + DB schema + auth
2) Customers/Services CRUD
3) Appointments CRUD + conflict validation
4) Calendar UI + appointment modal
5) Minimal polish + deploy

## Test Strategy
### Tooling
- Frontend: Vitest + React Testing Library + jsdom
- Backend: bun:test (native to Bun) + supertest-style request helpers if needed

### Test Scope
- Unit: date/time utils, formatting (e.g., "8h"), overlap validation
- Component: Day/Week view rendering, appointment block placement, empty states
- API: request validation, CRUD happy paths, overlap rejection, UTC storage
- E2E (later): create appointment, week -> day click scrolls to time

### First Tests (High Value)
1) Week time slot click navigates to day view and scrolls to selected time
2) Appointment positioning uses correct height/offset per duration
3) API rejects overlapping appointment times
4) UTC timestamps stored and returned as ISO strings

### Conventions
- Use fixed dates in tests to avoid timezone flakiness
- Keep tests fast and focused on user-visible behavior
