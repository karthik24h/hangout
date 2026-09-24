# PostgreSQL database

## Current requirements

`DATABASE_URL` configures the `pg` connection pool. `backend/database.db` is unused. No schema migration has been executed or supplied yet.

The SQL currently expects these columns, inferred from source rather than a live database inspection:

| Table | Required columns |
| --- | --- |
| users | id, name, email, password |
| rooms | room_code, name |

`users.password` stores a bcrypt hash. Actual ID types, constraints, indexes, and extra columns are unknown. Installing dependencies does not create tables. Existing deployments must provide a compatible database; fresh setup is blocked on schema provisioning until migrations are implemented.

## Target entities — proposed

| Entity | Purpose / principal fields |
| --- | --- |
| users | Identity, unique normalized email, password_hash, avatar, bio, timestamps |
| sessions | User, hashed opaque token/session identifier, expiration |
| password_reset_tokens | User, token hash, expiration, used timestamp |
| rooms | Unique code, name, type, host, password hash, lifecycle, timestamps |
| room_members | Room/user, role, join/leave timestamps |
| messages | Room/user, body, timestamps, retry-deduplication key |
| media_items | URL, type, title, source metadata, creator |
| room_queue_items | Room/media, order, creator, timestamp |
| room_playback | Current item, paused flag, position, server timestamp, revision |
| favorites | Unique user/media pair |
| user_settings | Validated appearance/playback/notification preferences |
| notifications | Recipient, type, payload, read state |
| room_activity | Room, actor, event type, timestamp |

Use foreign keys, unique constraints, validation constraints, and explicit retention/deletion policies. Use transactions for create-plus-host-membership, host transfer, queue reorder, and closure. Index membership lookups and message history. Keep typing and transient connections out of durable history.

## Migration plan

Inspect and back up the real database first. Create a versioned baseline compatible with existing IDs and accounts. Migrate the password column deliberately. Existing rooms have no trustworthy owner/type, so define an archive or upgrade policy rather than assigning invented owners. Test on a disposable database and document recovery before touching live data.
