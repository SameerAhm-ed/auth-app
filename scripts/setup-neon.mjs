// One-off: create the app_users schema in Neon.
// Run: node --env-file=.env.local scripts/setup-neon.mjs
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('No DATABASE_URL(_UNPOOLED) in env')
  process.exit(1)
}

const sql = neon(url)
const raw = readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8')

// Strip comment lines, then split into individual statements.
const statements = raw
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)

for (const stmt of statements) {
  await sql.query(stmt)
  console.log('✓', stmt.split('\n')[0].slice(0, 60))
}

const [{ count }] = await sql.query('SELECT count(*)::int AS count FROM app_users')
console.log(`\nDone. app_users exists — ${count} row(s).`)
