# MVP To-Do

## Setup
- [ ] Add backend dependencies: `hono`, session middleware, validation library (e.g. `zod`)
- [ ] Add auth dependency for password hashing (e.g. `bcrypt` or `argon2`)
- [ ] Set up SQLite access (Bun `bun:sqlite`)
- [ ] Add env config for session secret and database path

## Database
- [ ] Create schema/tables: users, customers, services, appointments
- [ ] Seed a single owner user for first login
- [ ] Add migration or bootstrap script

## Backend (Hono)
- [ ] Create Hono app and mount routes under `/api`
- [ ] Implement auth: login/logout/me with HTTP-only session cookie
- [ ] Protect all API routes (auth required)
- [ ] Implement customers CRUD
- [ ] Implement services CRUD
- [ ] Implement appointments CRUD
- [ ] Add overlap validation on appointment create/update (UTC comparison)
- [ ] Add date range filtering for appointments list

## Frontend (React SPA)
- [ ] Add router and protected routes
- [ ] Build login page and session check
- [ ] Build calendar page (day/week view)
- [ ] Build appointment modal form
- [ ] Build customers management page
- [ ] Build services management page
- [ ] Wire API client (fetch wrapper, error handling)
- [ ] Convert UTC from API to local time for display

## QA / UX
- [ ] Verify no overlapping appointments can be saved
- [ ] Verify UTC storage and local display are correct
- [ ] Handle empty states (no customers/services/appointments)
- [ ] Add basic loading and error states

## Launch
- [ ] Document setup and run commands in README
- [ ] Smoke test locally with seed data
- [ ] Decide hosting target and deploy
