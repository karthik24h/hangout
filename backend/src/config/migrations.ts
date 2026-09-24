import { Pool } from 'pg';
import { readEnv } from './env';

const pool = new Pool({ connectionString: readEnv().databaseUrl });

const MIGRATIONS_TABLE = '_migrations';

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const result = await pool.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`);
  return result.rows.map(r => r.name);
}

async function applyMigration(name: string, sql: string) {
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [name]);
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

export async function runMigrations() {
  const applied = await getAppliedMigrations();
  const pending = migrations.filter(m => !applied.includes(m.name));

  for (const migration of pending) {
    console.log(`Applying migration: ${migration.name}`);
    await applyMigration(migration.name, migration.sql);
    console.log(`Applied: ${migration.name}`);
  }

  if (pending.length === 0) {
    console.log('No pending migrations');
  }
}

interface Migration {
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    name: '001_create_users_and_rooms',
    sql: `
      CREATE EXTENSION IF NOT EXISTS citext;

      CREATE TABLE users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email CITEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE rooms (
        id BIGSERIAL PRIMARY KEY,
        room_code CHAR(6) NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT 'Unnamed Room',
        type TEXT NOT NULL CHECK (type IN ('video', 'music')),
        host_id BIGINT NOT NULL REFERENCES users(id),
        password_hash TEXT,
        privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'invite_only')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'closed', 'expired')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ
      );

      CREATE INDEX idx_rooms_room_code ON rooms(room_code);
      CREATE INDEX idx_rooms_host_id ON rooms(host_id);
      CREATE INDEX idx_rooms_status ON rooms(status);
    `,
  },
  {
    name: '002_create_sessions_and_password_resets',
    sql: `
      CREATE TABLE sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      );

      CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

      CREATE TABLE password_reset_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
      CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    `,
  },
  {
    name: '003_create_room_membership_and_messages',
    sql: `
      CREATE TABLE room_members (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'moderator', 'member', 'guest')),
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        left_at TIMESTAMPTZ,
        UNIQUE (room_id, user_id)
      );

      CREATE INDEX idx_room_members_room_id ON room_members(room_id);
      CREATE INDEX idx_room_members_user_id ON room_members(user_id);

      CREATE TABLE messages (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        client_idempotency_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_messages_room_id_created_at ON messages(room_id, created_at DESC);
      CREATE INDEX idx_messages_user_id ON messages(user_id);
      CREATE UNIQUE INDEX idx_messages_idempotency ON messages(client_idempotency_key) WHERE client_idempotency_key IS NOT NULL;
    `,
  },
  {
    name: '004_create_media_queue_and_playback',
    sql: `
      CREATE TABLE media_items (
        id BIGSERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('video', 'music')),
        title TEXT,
        duration_seconds INTEGER,
        thumbnail_url TEXT,
        creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE room_queue_items (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        media_id BIGINT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_room_queue_items_room_id_position ON room_queue_items(room_id, position);
      CREATE INDEX idx_room_queue_items_media_id ON room_queue_items(media_id);

      CREATE TABLE room_playback (
        room_id BIGINT PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
        current_media_id BIGINT REFERENCES media_items(id) ON DELETE SET NULL,
        paused BOOLEAN NOT NULL DEFAULT TRUE,
        position_seconds NUMERIC(10,3) NOT NULL DEFAULT 0,
        revision BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '005_create_favorites_settings_notifications',
    sql: `
      CREATE TABLE favorites (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_id BIGINT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, media_id)
      );

      CREATE TABLE user_settings (
        user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
        autoplay BOOLEAN NOT NULL DEFAULT TRUE,
        notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_notifications_user_id_read_at ON notifications(user_id, read_at);
    `,
  },
  {
    name: '006_create_room_activity',
    sql: `
      CREATE TABLE room_activity (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        actor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_room_activity_room_id_created_at ON room_activity(room_id, created_at DESC);
    `,
  },
];

export async function closePool() {
  await pool.end();
}
