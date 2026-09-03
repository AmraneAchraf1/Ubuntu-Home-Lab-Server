---
title: "Monitoring & Observability"
order: 17
description: "Real-time monitoring with htop, iotop, nethogs, nvidia-smi, journalctl for system logs, and automated disk space alert script with cron."
---
## Real-Time System Monitoring

```bash
# htop — interactive process viewer
htop
# Keys: F5=tree view, F6=sort, k=kill process, q=quit

# Disk I/O monitor
sudo iotop -o     # -o = only show processes doing I/O

# Network traffic per process
sudo nethogs wlp2s0   # replace with your interface

# Watch GPU continuously
watch -n 1 nvidia-smi

# Watch disk space
watch -n 5 'df -h'

# System overview
vmstat 1           # virtual memory stats every 1 second
iostat 1           # I/O stats every 1 second
free -h            # RAM usage

# Quick system summary
neofetch
```

## System Logs with journalctl

Systemd logs everything. `journalctl` is your window into it:

```bash
# All logs (most recent first)
journalctl -r

# Follow live logs
journalctl -f

# Logs for a specific service
journalctl -u nginx -f
journalctl -u docker
journalctl -u sshd

# Logs since last boot
journalctl -b

# Last 100 lines of everything
journalctl -n 100

# Logs with errors only
journalctl -p err

# Logs for a time range
journalctl --since "2026-05-19 10:00:00" --until "2026-05-19 11:00:00"

# Kernel messages
journalctl -k
dmesg | tail -20
```

## Disk Alert Script

```bash
mkdir -p ~/scripts
nano ~/scripts/disk_alert.sh
```

```bash
#!/bin/bash
# Disk space alert - sends wall message if usage exceeds threshold

THRESHOLD=85

check_disk() {
    local mount=$1
    local usage=$(df "$mount" | tail -1 | awk '{print $5}' | tr -d '%')
    if [ "$usage" -gt "$THRESHOLD" ]; then
        wall "⚠️  WARNING: $mount is ${usage}% full on $(hostname)!"
        logger "DISK ALERT: $mount is ${usage}% full"
    fi
}

check_disk /
check_disk /var
check_disk /home
check_disk /srv
check_disk /data
check_disk /mnt/storage
```

```bash
chmod +x ~/scripts/disk_alert.sh

# Schedule hourly
crontab -e
# Add: 0 * * * * /home/labadmin/scripts/disk_alert.sh