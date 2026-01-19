---
description: Use Bun for tooling, Vite for the frontend, and Hono for the API.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun for scripts and dependencies.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## Structure

- `frontend/` is the Vite + React SPA.
- `api/` is the Hono API running on Bun.
- Root `src/` is legacy template code and should not be extended.

## APIs

- Use Hono for routing and `Bun.serve({ fetch: app.fetch })` to start the server.
- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use Vite for the React SPA in `frontend/`. Tailwind CSS powers styling, shadcn/ui provides UI primitives (see `frontend/src/components/ui`), and lucide-react is used for icons.

Run the frontend:

```sh
cd frontend
bun install
bun dev
```

The Vite dev server proxies `/api` to the Hono API on port 3001.
