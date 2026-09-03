---
title: "Cheatsheet & Quick Reference"
order: 27
description: "Essential commands reference (system, files, networking, services, Docker, Git, archive, text processing), shell aliases, and server health check script."
---
## Essential Commands

```bash
# ─── SYSTEM ──────────────────────────────────────────────────
uname -a                    # kernel version + architecture
lscpu                       # CPU info
free -h                     # RAM usage
df -h                       # disk space
lsblk                       # block devices (disks)
ps aux                      # all running processes
ps aux | grep nginx         # find specific process
kill -9 PID                 # force kill process
pkill -f "node dist"        # kill by name pattern
uptime                      # system uptime + load average
who                         # who's logged in
last                        # recent logins

# ─── FILES ───────────────────────────────────────────────────
ls -la                      # list with permissions
ls -lh                      # human-readable sizes
find / -name "*.log" 2>/dev/null    # find files
find /var -size +100M       # files larger than 100MB
grep -r "error" /var/log/   # recursive search
grep -i "error" file.log    # case-insensitive
tail -f file.log            # follow file changes
wc -l file.txt              # count lines
sort file.txt | uniq -c     # sort and count unique lines

# ─── NETWORKING ──────────────────────────────────────────────
ip addr show                # IP addresses
ip route show               # routing table
ss -tlnp                    # listening ports
curl -I https://google.com  # HTTP headers only
wget -q -O - url | head     # download and preview
nmap -p 1-1000 192.168.1.1  # scan ports (install with apt)

# ─── SERVICES ────────────────────────────────────────────────
systemctl list-units --type=service --state=running
systemctl list-timers

# ─── DOCKER ──────────────────────────────────────────────────
docker ps -a                # all containers
docker images               # all images
docker stats                # resource usage live
docker inspect postgres     # detailed container info
docker exec -it NAME bash   # enter container
docker cp NAME:/path ./     # copy from container
docker volume ls            # list volumes
docker network ls           # list networks
docker system df            # disk usage by Docker

# ─── GIT ─────────────────────────────────────────────────────
git log --oneline -10       # recent commits
git diff HEAD~1             # changes in last commit
git stash                   # save uncommitted changes
git stash pop               # restore stashed changes

# ─── ARCHIVE ─────────────────────────────────────────────────
tar -czf archive.tar.gz dir/     # compress directory
tar -xzf archive.tar.gz          # extract
zip -r archive.zip dir/          # zip
unzip archive.zip

# ─── TEXT PROCESSING ─────────────────────────────────────────
cat file.txt | wc -l             # count lines
awk '{print $1}' file.txt        # print first column
sed 's/old/new/g' file.txt       # replace text
cut -d',' -f1,3 file.csv         # extract CSV columns
jq '.name' data.json             # parse JSON
```

## Shell Aliases — Add to `~/.bashrc`

```bash
# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ll='ls -alF'
alias la='ls -A'
alias proj='cd /srv/apps'
alias stor='cd /mnt/storage'
alias logs='cd /var/log'

# Docker
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dcup='docker compose up -d'
alias dcdn='docker compose down'
alias dlogs='docker compose logs -f'
alias dexec='docker exec -it'
alias dclean='docker system prune -f'

# Server
alias ports='ss -tlnp'
alias myip='hostname -I | awk "{print \$1}"'
alias gpu='watch -n 1 nvidia-smi'
alias disk='df -h'
alias mem='free -h'
alias cpu='htop'
alias syslog='sudo journalctl -f'

# PM2
alias pml='pm2 list'
alias pmlog='pm2 logs'
alias pmmon='pm2 monit'

# Safety
alias rm='rm -i'       # confirm before delete
alias cp='cp -i'       # confirm before overwrite
alias mv='mv -i'       # confirm before overwrite

# Shortcuts
alias update='sudo apt update && sudo apt upgrade -y'
alias reload='source ~/.bashrc'
alias myports='ss -tlnp | grep LISTEN'
alias biggest='du -h /* 2>/dev/null | sort -rh | head -15'
```

Apply: `source ~/.bashrc`

## Quick Diagnostics Script

Save as `~/scripts/health.sh`:

```bash
#!/bin/bash
echo "════════════════════════════════════════"
echo "  SERVER HEALTH — $(hostname) — $(date)"
echo "════════════════════════════════════════"
echo ""
echo "── UPTIME ──────────────────────────────"
uptime
echo ""
echo "── DISK ────────────────────────────────"
df -h | grep -v tmpfs | grep -v udev
echo ""
echo "── MEMORY ──────────────────────────────"
free -h
echo ""
echo "── CPU LOAD ────────────────────────────"
top -bn1 | grep "Cpu(s)"
echo ""
echo "── GPU ─────────────────────────────────"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu \
  --format=csv,noheader 2>/dev/null || echo "GPU not available"
echo ""
echo "── SERVICES ────────────────────────────"
for svc in nginx docker sshd fail2ban; do
    status=$(systemctl is-active $svc)
    echo "  $svc: $status"
done
echo ""
echo "── DOCKER CONTAINERS ───────────────────"
docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null
echo ""
echo "── PM2 PROCESSES ───────────────────────"
pm2 list 2>/dev/null | grep -v "└\|┌\|│ id" | head -10
echo ""
echo "── OPEN PORTS ──────────────────────────"
ss -tlnp | grep LISTEN
echo "════════════════════════════════════════"
```

```bash
chmod +x ~/scripts/health.sh
# Add alias
echo "alias health='~/scripts/health.sh'" >> ~/.bashrc
```

---

## Final Tips

1. **Always use `tmux`** — Never run long tasks without it
2. **Document your setup** — Keep a `~/NOTES.md` with what you installed and why
3. **Test backups** — A backup you've never restored is just hope
4. **Keep it simple** — Don't over-engineer. Add complexity only when needed
5. **Update regularly** — `sudo apt update && sudo apt upgrade -y` weekly
6. **Monitor logs** — `journalctl -f` should be your best friend
7. **Use version control** — Store your scripts and configs in a private git repo
8. **Principle of least privilege** — Services should run as non-root users
9. **One service per container** — Makes debugging and scaling much easier
10. **Read error messages** — 90% of the time the solution is in the first line of the error

---

*Guide tailored for: Intel i5 7th Gen · GTX 1050 Ti · Samsung NVMe 500GB · WD HDD 500GB · 16GB RAM · Ubuntu Server 24.04 LTS*