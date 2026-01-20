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
bun run seed
```

Environment variables:
- `DB_PATH` (default `data/app.db`)
- `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_NAME` for seeding the initial owner.

## Health check
- `GET http://localhost:3001/api/health`

## Notes
- API runs on port 3001 and expects the web app on 5173.
- Update CORS via `CORS_ORIGIN` env var if needed.

## Fly.io notes (SQLite + volume)
- `api/fly.toml` expects a volume named `plannerapp_data` mounted at `/data`.
- Create the volume: `fly volumes create plannerapp_data --region ams --size 1`
- Set the app name/region in `api/fly.toml` before deploy.
