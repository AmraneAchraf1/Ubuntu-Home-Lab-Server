---
title: "Backup Strategy & Disaster Recovery"
order: 18
description: "The 3-2-1 backup rule, automated rsync backups for /srv, /home, and Docker configs, PostgreSQL dumps with 7-day retention, scheduled via cron."
difficulty: Intermediate
estimatedTime: 30 min
prerequisites:
  - "/mnt/storage mounted (Chapter 7)"
  - "Postgres container running (Chapter 10)"
  - "rsync and cron available"
---

<ChapterMeta />

## TL;DR

- **Follow 3-2-1:** 3 copies, on 2 different media, with 1 offsite.
- **`rsync` mirrors `/srv`, `/home`, and Docker configs** — fast, incremental, and easy to schedule.
- **Dump Postgres with `pg_dumpall`** and compress it; keep a retention window.
- **Schedule daily via cron** so backups aren't a thing you remember to do.
- **A backup you've never restored is not a backup** — test a restore.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| `/mnt/storage` mounted | The local backup target. |
| Postgres running | To dump it. |
| `rsync`, `cron` | The tools used. |

## The 3-2-1 backup rule

- **3** copies of your data
- **2** different storage media
- **1** offsite backup

For your home lab: NVMe (live) + HDD (local backup) + external drive or cloud (offsite).

<figure>
  <svg viewBox="0 0 720 210" role="img" aria-label="3-2-1 backup rule: three copies of data across two different media with one copy offsite" width="100%" style="max-width:720px;height:auto;border-radius:10px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);padding:1rem;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;">
    <rect x="16" y="40" width="216" height="120" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-divider)"></rect>
    <text x="124" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--vp-c-text-1)">Copy 1 — live</text>
    <text x="124" y="98" text-anchor="middle" font-size="12" fill="var(--vp-c-text-2)">NVMe</text>
    <text x="124" y="120" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">medium A</text>
    <rect x="252" y="40" width="216" height="120" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-brand-1)"></rect>
    <text x="360" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--vp-c-brand-1)">Copy 2 — local</text>
    <text x="360" y="98" text-anchor="middle" font-size="12" fill="var(--vp-c-text-2)">HDD (/mnt/storage)</text>
    <text x="360" y="120" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">medium B</text>
    <rect x="488" y="40" width="216" height="120" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-brand-1)"></rect>
    <text x="596" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--vp-c-brand-1)">Copy 3 — offsite</text>
    <text x="596" y="98" text-anchor="middle" font-size="12" fill="var(--vp-c-text-2)">external / cloud</text>
    <text x="596" y="120" text-anchor="middle" font-size="11" fill="var(--vp-c-text-3)">survives fire/theft</text>
    <text x="16" y="188" font-size="11.5" fill="var(--vp-c-text-3)">If copies 1 and 2 share a location, a single event destroys both. Offsite is what makes it disaster recovery.</text>
  </svg>
  <figcaption><strong>Figure 18.1</strong> — The 3-2-1 rule: redundancy across media *and* location.</figcaption>
</figure>

## Step 1 — Create the backup script

**Run** to create it. **Expected:** running the script creates dated logs and artifacts under `/mnt/storage/backups`.

```bash [create-backup.sh]
nano ~/scripts/backup.sh
```

```bash [backup.sh]
#!/bin/bash
# Daily backup script
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mnt/storage/backups"
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting backup..."

# Backup /srv (NestJS apps, configs)
log "Backing up /srv..."
rsync -av --delete \
  /srv/ \
  "$BACKUP_DIR/srv/" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  >> "$LOG_FILE" 2>&1

# Backup /home
log "Backing up /home..."
rsync -av --delete \
  /home/ahmed/ \
  "$BACKUP_DIR/home/" \
  --exclude='.cache' \
  --exclude='aienv' \
  >> "$LOG_FILE" 2>&1

# Backup Docker configs
log "Backing up Docker configs..."
rsync -av \
  ~/docker/ \
  "$BACKUP_DIR/docker-configs/" \
  >> "$LOG_FILE" 2>&1

# Backup PostgreSQL
log "Backing up PostgreSQL..."
docker exec postgres pg_dumpall -U devuser 2>/dev/null | \
  gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Keep only last 7 days of DB backups
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime +7 -delete
log "Old DB backups cleaned up"

log "Backup complete!"
```

```mermaid
flowchart TD
  S[start backup.sh] --> SRV[rsync /srv → backups/srv]
  SRV --> HOME[rsync /home → backups/home]
  HOME --> DOCK[rsync ~/docker → docker-configs]
  DOCK --> PG[pg_dumpall | gzip]
  PG --> RET[delete DB dumps older than 7 days]
  RET --> DONE[done + log]
```

<p class="ahl-diagram-caption"><strong>Figure 18.2</strong> — The nightly job: mirror three trees with `rsync`, dump Postgres, then prune old dumps.</p>

::: warning `--delete` is powerful
`rsync --delete` makes the destination match the source exactly — including *removing* files. That's what you want for a mirror, but if you point the source at the wrong path, you can wipe good backups. Double-check the source before scheduling.
:::

## Step 2 — Schedule it

**Run** to enable and schedule. **Expected:** `crontab -l` lists the 3 AM job.

```bash [schedule-backup.sh]
chmod +x ~/scripts/backup.sh

# Schedule daily at 3 AM
crontab -e
# Add: 0 3 * * * /home/ahmed/scripts/backup.sh
```

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Script runs clean | `bash ~/scripts/backup.sh` | ends with "Backup complete!" |
| Artifacts exist | `ls -lh /mnt/storage/backups/` | `srv/`, `home/`, `postgres_*.sql.gz` |
| Dump is valid | `gunzip -c …postgres_*.sql.gz \| head` | SQL text |
| Scheduled | `crontab -l` | the daily job |
| Restore tested | pipe dump into a scratch DB | no errors |

```bash [verify.sh]
bash ~/scripts/backup.sh
ls -lh /mnt/storage/backups/
gunzip -c /mnt/storage/backups/postgres_*.sql.gz | head -5
crontab -l | grep backup
```

## Common pitfalls

::: warning Top 3 failure modes
1. **Never testing a restore.** Restore into a scratch DB now and then — otherwise you discover breakage during a real outage.
2. **Backups on the same disk as the data.** That's not a backup; a disk failure takes both. Keep copy 2 on the HDD and copy 3 offsite.
3. **`rsync --delete` pointed at the wrong source.** You can delete valid backups. Verify paths before scheduling.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backup dir empty | `/mnt/storage` not mounted | `findmnt /mnt/storage` (Chapter 7) |
| `pg_dumpall` errors | Container name/user changed | Match `docker exec postgres` to your compose (Chapter 10) |
| Cron job never runs | PATH/perm issues | Use absolute paths; check `grep CRON /var/log/syslog` |
| Disk fills with backups | Retention too long | Add `find … -mtime +N -delete` for all artifacts |
| Restore fails | Version mismatch | Restore with a matching Postgres client version |

## Recap & next

You have an automated, tested 3-2-1 backup of your apps, home, configs, and databases — the difference between a bad day and a disaster.

Next: **[Chapter 19 — Advanced Security Hardening](/chapters/19-advanced-security-hardening)** — go beyond the firewall.

## References

- [`man rsync`](https://manpages.ubuntu.com/manpages/noble/en/man1/rsync.1.html) — mirroring, `--delete`, excludes.
- [`man crontab(5)`](https://manpages.ubuntu.com/manpages/noble/en/man5/crontab.5.html) — cron schedule syntax.
- [`man crontab(1)`](https://manpages.ubuntu.com/manpages/noble/en/man1/crontab.1.html) — editing your crontab.
- [`pg_dumpall`](https://www.postgresql.org/docs/current/app-pg-dumpall.html) — cluster-wide dumps.
- [rsync project](https://rsync.samba.org/) — upstream documentation.
