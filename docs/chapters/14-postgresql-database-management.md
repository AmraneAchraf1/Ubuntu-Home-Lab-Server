---
title: "PostgreSQL & Database Management"
order: 14
description: "Connect to Postgres in Docker, create project databases, backup/restore with pg_dump/pg_dumpall, and NestJS TypeORM connection pooling configuration."
---
## Connecting to Postgres in Docker

```bash
# Connect directly
docker exec -it postgres psql -U devuser devdb

# Inside psql:
\l          -- list databases
\c devdb    -- connect to database
\dt         -- list tables
\d users    -- describe table 'users'
\q          -- quit
```

## Creating Databases for Different Projects

```bash
docker exec -it postgres psql -U devuser -c "CREATE DATABASE foodfacts;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_prod;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_test;"
```

## Backup and Restore

```bash
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

## NestJS TypeORM / Prisma Tips

For TypeORM in NestJS, use connection pooling:
```typescript
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