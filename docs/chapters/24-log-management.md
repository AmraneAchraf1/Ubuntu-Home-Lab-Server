---
title: "Log Management"
order: 24
description: "Key log locations (/var/log/syslog, auth.log, ufw.log, nginx), real-time viewing with tail -f, logsearch with grep, and logrotate configuration for app logs."
---
## Understanding Log Files

```bash
# Important log locations
/var/log/syslog          # General system log
/var/log/auth.log        # Authentication, SSH logins
/var/log/ufw.log         # Firewall (UFW) events
/var/log/nginx/          # Nginx access + error logs
/var/log/apt/            # Package installation history

# View logs in real time
tail -f /var/log/syslog
tail -f /var/log/auth.log    # Watch for SSH attempts
tail -f /var/log/nginx/error.log

# Search logs
grep "Failed password" /var/log/auth.log
grep "DENY" /var/log/ufw.log | tail -20
```

## Logrotate — Prevent Logs from Filling Disk

`logrotate` is already installed and configured for most system logs. Check your app's logs:

```bash
sudo nano /etc/logrotate.d/myapp
```

```
/var/log/myapp/*.log {
    daily
    rotate 14          # keep 14 days
    compress           # gzip old logs
    delaycompress      # don't compress the most recent
    missingok          # don't error if log doesn't exist
    notifempty         # skip rotation if log is empty
    create 0644 labadmin labadmin   # create new log with these permissions
    postrotate
        pm2 reloadLogs   # tell PM2 to reopen log files after rotation
    endscript
}