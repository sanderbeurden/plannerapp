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

## Health check
- `GET http://localhost:3001/api/health`

## Notes
- API runs on port 3001 and expects the web app on 5173.
- Update CORS via `CORS_ORIGIN` env var if needed.
