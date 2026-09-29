---
title: "PostgreSQL & Database Management"
order: 14
description: "Connect to Postgres in Docker, create project databases, backup/restore with pg_dump/pg_dumpall, and NestJS TypeORM connection pooling configuration."
difficulty: Intermediate
estimatedTime: 30 min
prerequisites:
  - "The Postgres container running (Chapter 10)"
  - "/mnt/storage/backups exists (Chapter 7)"
  - "A NestJS app that connects to Postgres (Chapter 13)"
---

<ChapterMeta />

## TL;DR

- **`psql` is your database shell** — reach it inside the container with `docker exec -it postgres psql`.
- **One database per project** keeps schemas isolated (`foodfacts`, `myapp_prod`, `myapp_test`).
- **Back up with `pg_dump` (single DB) or `pg_dumpall` (all), and compress with gzip.**
- **Restore is just piping the SQL back in** — and you should *test* it, not just create it.
- **Never run TypeORM with `synchronize: true` in production** — use migrations and connection pooling.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| Postgres container up | All commands run against it. |
| `/mnt/storage/backups` | Where dumps land (Chapter 7). |
| App config | To apply pooling tips. |

## Step 1 — Connect to Postgres in Docker

**Run** the connect command. **Expected:** a `devdb=#` prompt.

```bash [connect.sh]
# Connect directly
docker exec -it postgres psql -U devuser devdb

# Inside psql:
\l          -- list databases
\c devdb    -- connect to database
\dt         -- list tables
\d users    -- describe table 'users'
\q          -- quit
```

| Meta-command | Purpose |
|--------------|---------|
| `\l` | List databases |
| `\c <db>` | Connect to a database |
| `\dt` | List tables |
| `\d <table>` | Describe a table |
| `\q` | Quit |

## Step 2 — Create databases for different projects

**Run** the commands. **Expected:** `CREATE DATABASE` for each.

```bash [create-dbs.sh]
docker exec -it postgres psql -U devuser -c "CREATE DATABASE foodfacts;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_prod;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_test;"
```

## Step 3 — Backup and restore

**Run** the dump. **Expected:** a `.sql` (or `.sql.gz`) file under `/mnt/storage/backups/`.

```bash [backup.sh]
# Backup a database
docker exec postgres pg_dump -U devuser devdb > \
  /mnt/storage/backups/devdb_$(date +%Y%m%d_%H%M).sql

# Backup all databases
docker exec postgres pg_dumpall -U devuser > \
  /mnt/storage/backups/all_databases_$(date +%Y%m%d).sql

# Restore from backup
cat backup.sql | docker exec -i postgres psql -U devuser devdb

# Compressed backup (much smaller)
docker exec postgres pg_dump -U devuser devdb | gzip > \
  /mnt/storage/backups/devdb_$(date +%Y%m%d).sql.gz

# Restore compressed
gunzip -c backup.sql.gz | docker exec -i postgres psql -U devuser devdb
```

```mermaid
flowchart LR
  DB[(devdb)] -->|pg_dump| SQL[devdb_YYYYMMDD.sql]
  SQL -->|gzip| GZ[devdb_YYYYMMDD.sql.gz]
  GZ -->|stored| BK[/mnt/storage/backups]
  GZ -->|gunzip| SQL2[plain SQL]
  SQL2 -->|psql| DB2[(restored DB)]
```

<p class="ahl-diagram-caption"><strong>Figure 14.1</strong> — The backup/restore cycle: dump to SQL, compress for storage, then pipe it back to restore.</p>

| Task | Command |
|------|---------|
| Dump one database | `pg_dump -U <user> <db> > file.sql` |
| Dump everything | `pg_dumpall -U <user> > file.sql` |
| Restore | `psql -U <user> <db> < file.sql` |
| Compress | `pg_dump … \| gzip > file.sql.gz` |

## Step 4 — NestJS TypeORM / Prisma tips

For TypeORM in NestJS, use connection pooling:

```typescript [database.config.ts]
// database.config.ts
export const databaseConfig = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    max: 10,          // max connections in pool
    min: 2,           // min connections kept open
    idleTimeoutMillis: 30000,
  },
  synchronize: false,    // NEVER true in production
  migrationsRun: true,   // run migrations automatically
};
```

<figure>
  <svg viewBox="0 0 720 210" role="img" aria-label="Connection pooling diagram: the NestJS app holds a pool of connections, reusing a small number against Postgres instead of opening one per request" width="100%" style="max-width:720px;height:auto;border-radius:10px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);padding:1rem;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;">
    <rect x="16" y="60" width="180" height="80" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-divider)"></rect>
    <text x="106" y="92" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--vp-c-text-1)">NestJS app</text>
    <text x="106" y="112" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">many requests</text>
    <rect x="270" y="50" width="180" height="100" rx="10" fill="var(--vp-c-brand-soft)" stroke="var(--vp-c-brand-1)"></rect>
    <text x="360" y="80" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--vp-c-brand-1)">Connection pool</text>
    <text x="360" y="102" text-anchor="middle" font-size="11" fill="var(--vp-c-text-2)">max: 10 · min: 2</text>
    <text x="360" y="122" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">idleTimeout 30s</text>
    <rect x="524" y="60" width="180" height="80" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-divider)"></rect>
    <text x="614" y="92" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--vp-c-text-1)">Postgres</text>
    <text x="614" y="112" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">few server conns</text>
    <line x1="196" y1="100" x2="270" y2="100" stroke="var(--vp-c-text-3)"></line>
    <line x1="450" y1="100" x2="524" y2="100" stroke="var(--vp-c-brand-1)" stroke-width="2"></line>
    <text x="16" y="184" font-size="11.5" fill="var(--vp-c-text-3)">Pooling caps server connections: 10 reused connections serve thousands of requests.</text>
  </svg>
  <figcaption><strong>Figure 14.2</strong> — A bounded pool reuses a few connections, protecting Postgres from connection exhaustion.</figcaption>
</figure>

::: danger `synchronize: true` destroys data
With `synchronize: true`, TypeORM alters your schema to match entities at startup — silently dropping columns/tables it doesn't recognise. In production this can delete data. Use migrations (`migrationsRun: true`) instead.
:::

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Databases exist | `docker exec postgres psql -U devuser -l` | `devdb`, `foodfacts`, … |
| Dump is non-empty | `ls -lh /mnt/storage/backups/*.sql*` | files with sane sizes |
| Restore works | pipe a dump into a scratch DB | no errors |
| Pool bounded | `SELECT count(*) FROM pg_stat_activity;` | ≤ pool max |

```bash [verify.sh]
docker exec postgres psql -U devuser -c "\l"
docker exec postgres psql -U devuser devdb -c "SELECT count(*) FROM pg_stat_activity;"
ls -lh /mnt/storage/backups/
```

## Common pitfalls

::: warning Top 3 failure modes
1. **`synchronize: true` in production.** Startup schema drift can drop columns. Use migrations.
2. **Never testing a restore.** A backup you've never restored is a guess. Restore into a scratch DB regularly.
3. **Unbounded connections.** Every app instance opening its own pool can exhaust `max_connections`. Size pools and share Redis for coordination.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `FATAL: database "x" does not exist` | DB not created | `CREATE DATABASE x;` |
| `role "devuser" does not exist` | Wrong user / different container | Check `POSTGRES_USER` in compose (Chapter 10) |
| Restore errors mid-way | Existing objects conflict | Restore into an empty DB, or `DROP` first |
| `pg_dump: version mismatch` | Client newer than server | Match `pg_dump` to the server version |
| `too many clients already` | Pool too large / leaks | Lower `max`; check `pg_stat_activity` |

## Recap & next

You can create per-project databases, connect with `psql`, take compressed backups, restore them, and configure a safe connection pool in NestJS.

Next: **[Chapter 15 — OpenFoodFacts Data Pipeline](/chapters/15-openfoodfacts-data-pipeline)** — a real end-to-end workload using this database and your GPU.

## References

- [PostgreSQL documentation](https://www.postgresql.org/docs/) — the canonical reference.
- [`pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html) — single-database backups.
- [`pg_dumpall`](https://www.postgresql.org/docs/current/app-pg-dumpall.html) — cluster-wide backups.
- [`psql`](https://www.postgresql.org/docs/current/app-psql.html) — the client and its meta-commands.
- [TypeORM](https://typeorm.io/) — entities, migrations, pooling via `extra`.
- [NestJS database techniques](https://docs.nestjs.com/techniques/database) — integrating an ORM.
- [Prisma documentation](https://www.prisma.io/docs) — alternative ORM if you prefer it.
