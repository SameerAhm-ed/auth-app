# Artistic Milliners Dashboard (EMS)

Real-time energy management & monitoring dashboard for the Artistic Milliners sites
(AM4, AM5, AM14, AM15) — power houses, steam distribution, solar generation, and gas
pressures, polled live and visualized with role-based access.

Built with Next.js (App Router), React, Tailwind CSS v4, and MSSQL.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill in the database credentials. The app uses
two databases (a shared one for AM4/AM14/AM15 and a separate one for AM5) — see
`.env.example` for the full list of variables.

## PWA

The app is installable as a Progressive Web App (manifest + service worker in
`public/sw.js`). The service worker caches the app shell only — live API data always
comes from the network. To regenerate the icons from the brand mark:

```bash
node scripts/gen-icons.mjs
```

> **Note:** installation / service worker requires HTTPS in production (localhost is
> fine for development).
