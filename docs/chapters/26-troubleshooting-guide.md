---
title: "Troubleshooting Guide"
order: 26
description: "Common issues and solutions: SSH connection failures, service startup problems, disk full, PostgreSQL connection issues, NestJS crashes, GPU detection."
---
## Common Problems and Solutions

### Can't SSH into server
```bash
# Check SSH service is running (on server)
sudo systemctl status sshd

# Check firewall allows SSH
sudo ufw status | grep 22

# Check what's listening on port 22
ss -tlnp | grep :22

# Test from Mac with verbose output
ssh -v homelab
```

### Service won't start
```bash
# Always check status first
sudo systemctl status servicename

# Check detailed logs
journalctl -u servicename -n 50 --no-pager

# Check if port is already in use
ss -tlnp | grep :3000
```

### Disk full
```bash
# Find what's using space
df -h                           # which partition is full
du -sh /var/log/*               # check logs
du -sh /var/lib/docker/*        # check Docker
docker system prune -f          # clean Docker
sudo journalctl --vacuum-size=500M  # limit systemd logs to 500MB
```

### Can't connect to Postgres
```bash
docker ps | grep postgres       # is container running?
docker logs postgres            # check container logs
docker exec -it postgres psql -U devuser   # test direct connection
ss -tlnp | grep 5432            # is port open?
```

### NestJS app crashing
```bash
pm2 logs myapp --lines 100      # check PM2 logs
pm2 show myapp                  # check status and config
node dist/main.js               # run directly to see errors
```

### GPU not working
```bash
nvidia-smi                      # is GPU detected?
sudo journalctl -k | grep -i nvidia   # kernel messages about GPU
sudo apt install --reinstall nvidia-driver-535   # reinstall drivers