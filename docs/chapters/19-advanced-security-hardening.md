---
title: "Advanced Security Hardening"
order: 19
description: "SSH hardening with strong algorithms, AIDE file integrity monitoring, auditd for sudo/SSH config changes, and AppArmor application sandboxing."
---
## SSH Hardening

```bash
sudo nano /etc/ssh/sshd_config.d/hardening.conf
```

```
# Use only strong algorithms
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 5

# Disable unused features
AllowAgentForwarding no
PermitTunnel no
GatewayPorts no

# Login grace time (disconnect if not authenticated in 20s)
LoginGraceTime 20
```

## File Integrity Monitoring (AIDE)

AIDE tracks changes to system files and alerts when something unauthorized changes:

```bash
sudo apt install -y aide

# Initialize database (takes ~5 minutes)
sudo aideinit
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Check for changes
sudo aide --check

# Automate daily check
echo "0 4 * * * root aide --check | mail -s 'AIDE Report' root" | \
  sudo tee -a /etc/cron.d/aide
```

## Audit Log with auditd

```bash
sudo apt install -y auditd

# Monitor sudo usage
sudo auditctl -w /etc/sudoers -p wa -k sudoers_changes

# Monitor SSH config changes
sudo auditctl -w /etc/ssh/sshd_config -p wa -k ssh_config_changes

# View audit logs
sudo ausearch -k sudoers_changes
sudo ausearch -k ssh_config_changes
```

## AppArmor — Application Sandboxing

AppArmor restricts what applications can do. It's already enabled on Ubuntu:

```bash
sudo aa-status           # show AppArmor status
sudo apparmor_status     # detailed status

# Nginx profile (comes pre-installed)
sudo aa-enforce nginx     # enforce strict mode
sudo aa-complain nginx    # log violations but don't block