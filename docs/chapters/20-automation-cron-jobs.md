---
title: "Automation & Cron Jobs"
order: 20
description: "Cron syntax explanation, practical examples (daily, hourly, weekly), and systemd timers as more reliable alternative with Persistent and RandomizedDelaySec."
---
## Understanding Cron Syntax

```
┌─────────── minute (0-59)
│  ┌──────── hour (0-23)
│  │  ┌───── day of month (1-31)
│  │  │  ┌── month (1-12)
│  │  │  │  ┌─ day of week (0-6, Sun=0)
│  │  │  │  │
*  *  *  *  *  command
```

```bash
# Edit your cron jobs
crontab -e

# Examples:
0 3 * * *     ~/scripts/backup.sh           # Daily at 3 AM
0 * * * *     ~/scripts/disk_alert.sh       # Every hour
*/5 * * * *   ~/scripts/health_check.sh     # Every 5 minutes
0 0 * * 0     docker system prune -f        # Weekly Sunday midnight cleanup
30 2 * * 1    sudo apt update && sudo apt upgrade -y   # Weekly Monday updates
```

```bash
# View current cron jobs
crontab -l

# System-wide cron jobs
ls /etc/cron.d/
ls /etc/cron.daily/
ls /etc/cron.weekly/
```

## Systemd Timers (Better Than Cron)

Systemd timers are more reliable than cron — they log to journald and can handle system wakeup:

```bash
sudo nano /etc/systemd/system/backup.service
```

```ini
[Unit]
Description=Daily Backup
After=network.target

[Service]
Type=oneshot
User=labadmin
ExecStart=/home/labadmin/scripts/backup.sh
```

```bash
sudo nano /etc/systemd/system/backup.timer
```

```ini
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=daily
Persistent=true    # run if missed (e.g., server was off)
RandomizedDelaySec=30m   # add random delay to avoid all timers running at once

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable backup.timer
sudo systemctl start backup.timer
sudo systemctl list-timers    # show all active timers