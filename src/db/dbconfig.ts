// DB connection config. Secrets live in `.env.local` (gitignored) — never
// hardcode credentials here. See `.env.example` for the required variables.
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
