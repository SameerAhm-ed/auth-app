// DB connection configs. Secrets live in `.env.local` (gitignored) — never
// hardcode credentials here. See `.env.example` for the required variables.

// Main database (AM4 / AM14 / AM15 — shared).
export const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    instancename: "",
    encrypt: false,
  },
  port: Number(process.env.DB_PORT ?? 1433),
}

// AM5 database (separate server / credentials).
export const configAM5 = {
  user: process.env.DB_AM5_USER!,
  password: process.env.DB_AM5_PASSWORD!,
  server: process.env.DB_AM5_SERVER!,
  database: process.env.DB_AM5_NAME!,
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    instancename: "",
    encrypt: false,
  },
  port: Number(process.env.DB_AM5_PORT ?? 1433),
}
