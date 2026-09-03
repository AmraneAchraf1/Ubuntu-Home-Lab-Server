---
title: "Firewall & Network Security"
order: 9
description: "UFW firewall setup with default deny/allow policies, restricting dev ports to local network, Fail2ban for automatic IP banning, and unattended security updates."
---
## How UFW Works

UFW (Uncomplicated Firewall) is a frontend for `iptables` (the kernel's packet filtering system). Think of it as a bouncer at the door of your server — it decides which network connections are allowed in and out.

By default, we want:
- **Incoming**: DENY everything except what we explicitly allow
- **Outgoing**: ALLOW everything (your server needs to download packages, etc.)

## Initial Firewall Setup

```bash
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH FIRST — if you forget this, you lock yourself out!
sudo ufw allow ssh   # allows port 22

# Allow web traffic
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Enable the firewall
sudo ufw enable

# Verify status
sudo ufw status verbose
```

## Restricting Dev Ports to Local Network Only

Your development services (Postgres, Redis, NestJS) should only be accessible from your home network, not the whole internet:

```bash
# Allow Postgres only from home network
sudo ufw allow from 192.168.1.0/24 to any port 5432 proto tcp

# Allow Redis only from home network
sudo ufw allow from 192.168.1.0/24 to any port 6379 proto tcp

# Allow NestJS dev server from home network
sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp

# Allow pgAdmin from home network
sudo ufw allow from 192.168.1.0/24 to any port 5050 proto tcp

# Allow Ollama AI from home network
sudo ufw allow from 192.168.1.0/24 to any port 11434 proto tcp
```

## Fail2ban — Automatic IP Banning

Fail2ban monitors log files for repeated failed login attempts and automatically bans the offending IP. Bots constantly try to brute-force SSH passwords — Fail2ban stops them.

```bash
sudo apt install -y fail2ban
```

Create a local config (never edit the main config — it gets overwritten on updates):
```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
# Ban duration: 1 hour
bantime = 3600
# Window to count failures: 10 minutes
findtime = 600
# Number of failures before ban
maxretry = 5
# Email for notifications (optional)
# destemail = you@email.com

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3        # SSH gets stricter limit
bantime = 86400     # Ban for 24 hours for SSH
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Manually ban an IP
sudo fail2ban-client set sshd banip 1.2.3.4

# Manually unban an IP (if you accidentally ban yourself)
sudo fail2ban-client set sshd unbanip 1.2.3.4

# View banned IPs
sudo fail2ban-client status sshd | grep "Banned IP"
```

## Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades

# Configure it
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes"

# Edit the config to also update non-security packages (optional)
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

In that file, uncomment:
```
"${distro_id}:${distro_codename}-updates";
```

Enable automatic reboots for kernel updates (be careful if you have services):
```
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
```