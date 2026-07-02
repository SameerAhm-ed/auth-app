<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Known conventions in this build (learned the hard way)

- **Route handlers MUST be named function exports** — `export async function GET()` /
  `POST()` etc. The `export const GET = handler` form does **not** register the method:
  the build still "passes" (routes are collected) but every request 404s at runtime.
  So put any wrapper *inside* the function: `export async function GET() { return respondJson(() => query(...)) }`.
  (Verified against `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.)
- **Middleware lives in `src/proxy.ts`** (exports `proxy` + `config`), not `middleware.ts`.
- **Error boundaries use `unstable_retry`**, not `reset`.
