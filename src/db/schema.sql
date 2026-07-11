-- Auth / users schema for the Neon (Postgres) app database.
-- Run once against the Neon DB (e.g. `psql "$DATABASE_URL" -f src/db/schema.sql`
-- or paste into the Neon SQL editor). Idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text UNIQUE NOT NULL,                 -- lowercased login id
  name           text NOT NULL,
  email          text,                                 -- optional, for later
  password_hash  text NOT NULL,
  role           text NOT NULL DEFAULT 'user'
                   CHECK (role IN ('admin','manager','user')),
  sites          text[] NOT NULL DEFAULT '{}',         -- e.g. {am5,razzakabad}
  is_active      boolean NOT NULL DEFAULT true,
  must_change_pw boolean NOT NULL DEFAULT false,        -- reserved, unused in v1
  token_version  integer NOT NULL DEFAULT 0,            -- reserved for instant revoke
  last_login     timestamptz,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_users_username_idx ON app_users (username);
