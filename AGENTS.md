# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` is the Vite + React SPA. UI lives in `frontend/src`, with `frontend/index.html` as the entry and `frontend/vite.config.ts` for dev proxying.
- Tailwind + shadcn/ui live in `frontend/tailwind.config.js`, `frontend/postcss.config.cjs`, `frontend/src/components/ui`, and `frontend/src/lib/utils.ts`.
- `api/` is the Hono API on Bun. Server entry is `api/src/index.ts`. Add routes under `api/src/routes/` and data access under `api/src/db/` as the app grows.
- Root docs: `PLAN.md`, `to-do.md`, and `AGENTS.md`.

## Build, Test, and Development Commands
- Frontend dev: `cd frontend && bun install && bun dev` (Vite on `localhost:5173`).
- API dev: `cd api && bun install && bun dev` (Hono on `localhost:3001`).
- Root helpers: `bun run dev:web` and `bun run dev:api`.
- SPA build: `cd frontend && bun run build`, preview with `bun run preview`.
- Tests are not configured yet; use `bun test` once added.

## Coding Style & Naming Conventions
- TypeScript + React (`.tsx`) in `frontend/src`, 2-space indentation, semicolons.
- Components in PascalCase (e.g., `AppointmentForm.tsx`), hooks as `useX.ts`.
- Use Tailwind utility classes for layout/spacing; prefer shadcn/ui primitives for reusable UI elements.
- Use `lucide-react` for icons.
- API routes use Hono and are mounted under `/api/*`.
- Store timestamps in UTC in the API and convert to local time in the browser.

## Testing Guidelines
- Prefer `bun:test` for both frontend and API tests.
- Suggested locations: `frontend/src/**/*.test.tsx` and `api/src/**/*.test.ts`.

## Commit & Pull Request Guidelines
- No established convention; use concise, imperative commits (e.g., “Add appointment overlap validation”).
- PRs should summarize behavior changes and include screenshots for UI changes.

## Tooling & Runtime Notes
- Use Bun for installs and scripts; avoid npm/yarn.
- Vite runs the SPA; Hono runs the API. Configure CORS via `CORS_ORIGIN` if needed.
