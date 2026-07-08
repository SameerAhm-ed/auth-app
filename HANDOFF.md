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

## Session handoff — current state (read this first)

**What the app is:** real-time captive power + steam monitoring for Artistic Milliners
(textile group, Karachi). Live values come from **two MSSQL DBs** written every second by a
local plant backend (current-snapshot tables, NOT history — so DB durability is low-stakes;
it self-heals). **Historical** data comes from the external EMS via `proxy-query`
(`http://ems.am5pearl.com:5000`). Prod target: **24/7, 30+ concurrent users**. MSSQL is a
**free internet-hosted tier** (connection-capped, no SLA, `encrypt: false` = cleartext — must fix).

**Gotcha (documented in AGENTS.md):** modified Next 16 build — route handlers MUST be
`export async function GET()`; `export const GET = ...` silently 404s at runtime.

**Done this session (all builds green — tsc/eslint/next build):**
- **API refactor**: routes → `respondJson` (`src/lib/api.ts`) + typed pooled `query`
  (`src/db/query.ts`) via `getPool`; AM4/14/15 now use `getPool('main', config)`.
- **Dedup**: shared `Gauge`; AM4/14/15 pages migrated onto `MetricCard`/`useLiveData`/`MetricStates`;
  `useLiveData` hardened (abort + pause-on-hidden + non-overlap + keep-last-good); 30s timeouts on report fetches.
- **AM4**: solar relabeled (SOLAR AM4 / AM4 B / AM4C T2); GB Robey steam wired; overview steam multi-source on shared `Donut`;
  **KE regrouped** into KE 4A (sanction 4800; KE 4A 1=3000/KE_1, 4A 2=2500/KE_2, 4A 3=750 placeholder) + KE 4C (sanction 4975; 4C 1=2500/KE_3, 4C 2=2500 placeholder), per-engine donut vs rated capacity + group sanction/running totals.
- **Dashboard overview redesigned** → categorized admin panel. Data-driven config
  `src/lib/dashboardCategories.ts` (per-AM `live` flag, category `icon`); client `DashboardGrid.tsx`
  polls **`/api/v1/summary`** (new: per-AM live Power kW + Steam T/H) and shows plant summary strip +
  per-category combined Power/Steam + monogram tiles (green Online / muted Coming soon).
  Categories: **Razzakabad** (AM5, AM17, AM8) · **Denim** (AM2, AM PQ, AM16) · **Garments** (AM4, AM14, AM15) · **Spinning** (AM3).
  New AMs gated admin/manager in `SITE_PERMISSIONS`; 6 placeholder pages via `src/components/ComingSoon.tsx` (AM PQ slug = `am_pq`).

**Placeholders / partial:** 6 placeholder AM dashboards; AM14 steam/solar stubs; AM4/14/15 historical reports are "coming soon"; most AM5 engine report tags not set; AM4/AM15 overview report bar-icons are unwired `<button>`s (TODO); status is config-driven, not real-time.

**🔴 Open blockers (unchanged, urgent for prod):** (1) `/api/v1/*` unauthenticated incl. `/api/v1/summary` + `proxy-query` open relay; (2) DB `encrypt:false`; (3) in-memory users; (4) `JWT_SECRET` hardcoded fallback; (5) open self-registration; (6) 1s polling (now also `/api/v1/summary` = 4 queries/sec) — needs **poller + Redis** (collapses N readers → 1; the key fix for 30+ users on a free DB).

**Deployment plan (agreed):** move to **managed MSSQL (Azure SQL)** + **Azure Container Apps** + **Azure Cache for Redis**, container (`output: 'standalone'` — verify on this build), GH Actions CI/CD (one image → staging → manual prod), health endpoints, monitoring (alert on DB connections + poller staleness first). DB durability low priority (ephemeral data); availability + TLS + connection-fanout are the real concerns.

**Next big direction — turn monitoring into an EMS (for management/boss demo):** build on a
**shared monthly Tariff module** (rates change monthly; replace the steam report's localStorage
prices) → **live Cost (PKR) + Carbon/solar%** on overview + **control-room wallboard/TV mode** →
**alerts** (FAULT / mill-offline / running-expensive-source via WhatsApp+email+in-app) →
**production ingest → Specific Energy Consumption** (energy & Rs per kg/meter — the standout metric) →
**targets + mill league table + auto PDF** (replace their Excel). Sequence: Tariff+Cost/Carbon → Wallboard → Alerts → SEC → Targets/Reports.
Open Qs for user: production units/source per mill, KE tariff structure (flat vs peak/off-peak), ESG standard (Higg/ISO 50001?).

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
