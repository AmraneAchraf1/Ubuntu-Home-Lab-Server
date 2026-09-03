---
title: "Backup Strategy & Disaster Recovery"
order: 18
description: "3-2-1 backup rule, automated rsync backups for /srv, /home, Docker configs, and PostgreSQL with 7-day retention, scheduled via cron."
---
## The 3-2-1 Backup Rule

- **3** copies of your data
- **2** different storage media
- **1** offsite backup

For your home lab: NVMe (live) + HDD (local backup) + external drive or cloud (offsite).

## Automated Backup with rsync

```bash
nano ~/scripts/backup.sh
```

```bash
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
  /home/labadmin/ \
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

```bash
chmod +x ~/scripts/backup.sh

# Schedule daily at 3 AM
crontab -e
# Add: 0 3 * * * /home/labadmin/scripts/backup.sh