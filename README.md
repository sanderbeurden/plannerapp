# Planner App

React SPA (Vite) + Hono API (Bun).

## Structure
- `frontend/` — Vite + React SPA
- `api/` — Hono API (Bun)

## Dev (two terminals)
Frontend:
```bash
cd frontend
bun install
bun dev
```

API:
```bash
cd api
bun install
bun dev
```

### SQLite setup (API)
```bash
cd api
bun run migrate
```

Environment variables:
- `DB_PATH` (default `data/app.db`)
- `CORS_ORIGIN` (comma-separated)
- `APP_BASE_URL` (e.g. `https://app.example.com`)
- `RESEND_API_KEY`
- `RESEND_FROM` (e.g. `Salon Daybook <hello@yourdomain.com>`)

## Health check
- `GET http://localhost:3001/api/health`

## Notes
- API runs on port 3001 and expects the web app on 5173.
- Update CORS via `CORS_ORIGIN` env var if needed.

## Backups & Export
- CSV exports: visit Settings → Data export (or call `GET /api/exports/clients` and `GET /api/exports/appointments`).
- Full backup: copy the SQLite database file (default `api/data/app.db` or the path set in `DB_PATH`).

## Fly.io notes (SQLite + volume)
- `api/fly.toml` expects a volume named `plannerapp_data` mounted at `/data`.
- Create the volume: `fly volumes create plannerapp_data --region ams --size 1`
- Set the app name/region in `api/fly.toml` before deploy.
