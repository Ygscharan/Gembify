import pg from 'pg';

const { Pool } = pg;

let pool = null;
let initialized = false;

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool() {
  if (!isPostgresEnabled()) {
    return null;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL.trim();
    const isLocal =
      connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const disableSsl = process.env.DATABASE_SSL === 'false';

    pool = new Pool({
      connectionString,
      ssl: isLocal || disableSsl ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB Pool Error]', err.message);
    });
  }

  return pool;
}

export async function initDatabase() {
  if (initialized) return;

  if (!isPostgresEnabled()) {
    initialized = true;
    return;
  }

  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      password_encrypted TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
  `);

  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_encrypted TEXT;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      input JSONB NOT NULL,
      analysis JSONB NOT NULL,
      chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_reports_user_created
    ON reports (user_id, created_at DESC);
  `);

  initialized = true;
}
