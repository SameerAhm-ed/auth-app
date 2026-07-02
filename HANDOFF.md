# HANDOFF — Artistic Milliners Dashboard (EMS)

Project: `C:\Users\Javeria Naseer\Desktop\sameer\auth-app`

Real-time energy-monitoring dashboard. **Next.js 16 (App Router — a *modified* build:
read `node_modules/next/dist/docs/` before writing Next-specific code; e.g. route
middleware lives in `src/proxy.ts`, error boundaries use `unstable_retry` not `reset`).**
React 19, Tailwind CSS v4, MSSQL (`mssql`). Deployed on Vercel and working.

## Architecture & conventions (follow these)

- **Design tokens** — `src/app/globals.css` (`@theme`, intentionally grayscale).
  Use utilities: `bg-surface`, `bg-canvas`, `bg-surface-subtle`, `text-ink` /
  `text-ink-secondary` / `text-ink-muted`, `border-line` / `border-line-strong`,
  `bg-brand` / `text-brand-fg` / `bg-brand-subtle`, `text-danger` / `bg-danger-bg`.
  **Dark mode** via a `.dark` class on `<html>` (anti-FOUC script in root layout +
  `ThemeToggle`). Never hardcode hex for chrome; series/fuel/status colors are the
  deliberate exception.
- **UI primitives** — `src/components/ui/`: `Card`, `Button` (+ `buttonVariants`),
  `Input`, `Alert`, plus `src/lib/cn.ts`.
- **Live-data components** — `src/components/metrics/`:
  - `useLiveData(endpoint, ms=1000)` — crash-safe 1s polling hook returning `{ data, loading, error }`.
  - `MetricCard` — gauge + primary value + status pill + optional fuel badge + extra readouts + report link.
  - `BoilerPage` — shared page for steam/boiler grids (flow gauge + pressure/water/etc.).
  - `Donut` — multi-segment SVG donut with centered hero label.
  - `MetricStates` — `MetricGridSkeleton`, `StateCard`.
  - `status.ts` — `engineStatus(error, load)` (sites with error flags), `loadStatus(value)`
    (AM5, no error flags), `FUEL` map + `fuelFromBit`.
- **Database** — two databases via a pooled registry:
  - `src/db/pools.ts` → `getPool(key, config)` (one cached `ConnectionPool` per DB; avoids
    the global-pool collision when talking to two servers).
  - `src/db/dbconfig.ts` → `config` (shared AM4/AM14/AM15) and `configAM5`.
  - Creds in `.env.local` (gitignored), documented in `.env.example`.
  - AM5 DB = `artistic_ems`; AM4/14/15 = `ems_am15_db` (shared).
- **API routes** — nested `/api/v1/{site}/{resource}` (e.g. `am5/powerhouse1`,
  `am4/solar`, `am14/powerhouse`). Clean `try/catch`, HTTP 500 + generic message on
  failure, full error logged server-side, `export const dynamic = 'force-dynamic'`.
- **Pages** — config-driven (engine/boiler/array arrays), always with loading / empty /
  error states, dark-mode SVG gauges, 1s polling. Report icons link to
  `…/powerhouse/[id]` placeholder report routes.
- **Auth** — JWT cookie (`jose`), role-based access enforced in `src/proxy.ts`;
  in-memory seeded users in `src/lib/users.ts` (reset on restart).

## What's done

- All four sites (AM4, AM5, AM14, AM15) fully themed + live on the new system.
- **AM5** (biggest): overview with live **`EnergyFlow`** diagram (CSS-animated, no
  framer-motion) + distribution + electrical/steam donuts + gas pressures; 4 power
  houses, 4 steam power houses, 2 coal boilers, solar (with EMS `proxy-query` "yesterday
  kWh"). Grouped sidebar nav. Endpoints: `/api/v1/am5/{dashboard,overview,powerhouse1-4,
  steamph1-4,solar,proxy-query}`. `proxy-query` proxies the public
  `http://ems.am5pearl.com:5000` EMS server.
- **PWA** — `src/app/manifest.ts` (→ `/manifest.webmanifest`), `public/sw.js`
  (app-shell cache: `/api/*` network-only, navigations network-first → cache → `/offline`),
  icons in `public/icons/` (regen: `node scripts/gen-icons.mjs`), `InstallButton`
  (navbar, Android/desktop), `IosInstallHint` (iOS Add-to-Home banner),
  `ServiceWorkerRegister`, `/offline` page, themeColor/apple meta in root layout.
- **Renamed** everywhere → display "Artistic Milliners Dashboard", short "EMS",
  package `artistic-ems`.

## Open / optional (not started)

- **DB-backed user authentication & authorization** — *planned, do NOT implement until
  explicitly asked.* Users are currently in-memory + seeded on boot (`src/lib/users.ts`),
  which resets on restart and doesn't persist on serverless. The plan: move users (and
  their role/site assignments) into a real `users` table in the main MSSQL DB, hash
  passwords with bcrypt as now, keep the JWT-cookie session (`src/lib/auth.ts`) and the
  role→site permission model (`src/lib/constants.ts` `SITE_PERMISSIONS`/`ROLE_SITES`).
  Also as part of this: **gate the data API** — `src/proxy.ts` currently only matches
  `/dashboard/*`, so `/api/v1/*` routes are unauthenticated; extend the matcher (or add a
  per-route `requireAuth(site)` helper) so API access enforces the same login + per-site
  role checks as the UI, and lock down `/api/v1/am5/proxy-query`. Replace open
  self-registration with admin-managed accounts, and make `JWT_SECRET` mandatory in prod.
- **Real per-engine historical report pages** — AM5 now has a real, shared report
  (`src/components/metrics/HistoryReport.tsx`) pulling cumulative meters from the EMS
  `proxy-query` by tag id, wired via `src/components/metrics/reportLink.ts`; cards show the
  report icon only when a `tag` is set (solar + PH2 done, rest add `tag:` incrementally).
  AM4/AM14/AM15 `powerhouse/[id]` routes are still themed placeholders.
- **Steam Generation Report** — `dashboard/am5/reports/steam` (linked from the AM5 overview
  "Steam Generation" card via a bar icon). Cumulative per-power-house steam, gas/HRSG, coal,
  fuel mix + cost, with a styled **XLSX export** (`xlsx-js-style`, lazy-imported only on
  export). Tag ids + conversions are hard-coded near the top of the file; fuel prices persist
  to `localStorage`. Hits the same `/api/v1/am5/proxy-query` EMS proxy.
- **Forgot-password** flow (login has an empty slot reserved).

> **Device-correctness — DONE** (v2 UI/UX audit, no longer outstanding): `100vh`→`dvh`
> app-wide; iOS safe-area on sticky navbar + mobile drawer (`viewportFit: 'cover'`);
> drawer focus trap + focus restore; `<main>` landmarks + skip-to-content link; 360px
> responsive sweep — navbar de-cluttered (logout is icon-only on mobile) and all chrome +
> in-card report icons are 44px touch targets on mobile, condensing to compact sizes at `md`.
- **Scaling**: 1s polling × serverless functions on Vercel opens many DB connections
  (somee free-tier limits). Consider a small server-side cache / fewer polls / SSE if many
  concurrent users.

## Verify / run

- `npm run dev` (binds to a LAN host per `package.json`), or `npm run build && npm start`.
- Service worker only registers on a production build over HTTPS (localhost exempt).
- On Vercel: set all `DB_*` and `DB_AM5_*` env vars in project settings; ensure the MSSQL
  hosts allow Vercel IPs.
- Pre-existing harmless warning: multiple lockfiles (a stray
  `C:\Users\Javeria Naseer\package-lock.json`); silence via `outputFileTracingRoot` if desired.
