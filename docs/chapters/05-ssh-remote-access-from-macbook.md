---
title: "SSH — Remote Access from MacBook"
order: 5
description: "Set up SSH key authentication, SSH config shortcuts, server hardening, port forwarding for database access, and VS Code Remote SSH development."
---
## How SSH Works (The Concept)

SSH (Secure Shell) creates an encrypted tunnel between your Mac and your server. Think of it as a secure pipeline — everything you type travels through this encrypted channel, so even if someone intercepts your WiFi packets, they see only gibberish.

```
Your MacBook                    Your Server
┌──────────┐   Encrypted      ┌──────────┐
│ Terminal │ ◄───────────────► │  sshd    │
│          │   SSH Tunnel     │ (daemon) │
└──────────┘   Port 22        └──────────┘
```

`sshd` (SSH daemon) is the server-side process that listens on port 22 and accepts connections. You enabled this during installation when you checked "Install OpenSSH".

## Step 1: Find Your Server's IP

On the server, right after installation:

```bash
ip addr show
# or simpler:
hostname -I
```

Look for something like `192.168.1.105` — this is your server's current IP on your home network. We'll make this permanent in Chapter 6.

## Step 2: First SSH Connection

On your **MacBook**:

```bash
ssh labadmin@192.168.1.105
```

First time, you'll see:
```
The authenticity of host '192.168.1.105' can't be established.
ED25519 key fingerprint is SHA256:abc123...
Are you sure you want to continue connecting (yes/no)?
```

Type `yes`. This saves the server's **fingerprint** to `~/.ssh/known_hosts` on your Mac. Next time, SSH verifies the server is the same machine (prevents man-in-the-middle attacks).

## Step 3: SSH Key Authentication — No More Passwords

Password authentication is less secure and annoying. SSH keys use **asymmetric cryptography**:

- You have a **private key** (stays on your Mac, NEVER share this)
- You have a **public key** (goes on the server, safe to share)
- The server challenges you with something only the private key can answer

```bash
# On your MacBook — generate a key pair
ssh-keygen -t ed25519 -C "macbook-homelab-$(date +%Y)"
# -t ed25519: modern elliptic curve algorithm (better than RSA)
# -C: comment to identify the key
# Accept defaults (saves to ~/.ssh/id_ed25519)
# Set a passphrase for extra security (optional but recommended)
```

This creates two files:
- `~/.ssh/id_ed25519` — Your private key (guard this like a password)
- `~/.ssh/id_ed25519.pub` — Your public key (copy this to server)

```bash
# Copy public key to server
ssh-copy-id labadmin@192.168.1.105
# This appends your public key to ~/.ssh/authorized_keys on the server
```

Now test — it should connect without asking for a password:
```bash
ssh labadmin@192.168.1.105
```

## Step 4: SSH Config — Shortcuts and Options

Create/edit `~/.ssh/config` on your **MacBook**:

```
# ~/.ssh/config

Host homelab
    HostName 192.168.1.100      # Will be your static IP from Chapter 6
    User labadmin
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60      # Send keepalive every 60 seconds
    ServerAliveCountMax 3       # Disconnect after 3 missed keepalives
    Compression yes             # Compress data (faster on WiFi)
    ForwardAgent no             # Don't forward SSH agent (security)
```

Now you can connect with just:
```bash
ssh homelab
```

## Step 5: Hardening SSH on the Server

Edit the SSH server config:

```bash
sudo nano /etc/ssh/sshd_config
```

Change these settings:

```bash
# Disable password authentication (once keys work!)
PasswordAuthentication no

# Don't allow root login
PermitRootLogin no

# Only allow your user
AllowUsers labadmin

# Use only modern key types
PubkeyAuthentication yes

# Change default port (optional but reduces bot spam)
# Port 2222   ← uncomment to use non-standard port

# Disable unused features
X11Forwarding no
AllowTcpForwarding yes   # Keep yes — needed for port forwarding

# Timeout idle sessions
ClientAliveInterval 300
ClientAliveCountMax 2
```

Apply changes:
```bash
sudo systemctl restart sshd
```

::: warning
**CRITICAL:** Do NOT close your current SSH session until you verify a new session works. Open a second terminal and test `ssh homelab`. If it works, you're safe. If not, you still have your old session to fix things.
:::

## SSH Port Forwarding — Access Server Services from Mac

This is incredibly useful. It lets you access any port on your server as if it was on your Mac:

```bash
# Access server's PostgreSQL (port 5432) locally on Mac
ssh -L 5432:localhost:5432 homelab

# Now on your Mac, connect to localhost:5432 with TablePlus/DBeaver
# It actually connects to the server's Postgres through the SSH tunnel

# Access pgAdmin (port 5050) locally
ssh -L 5050:localhost:5050 homelab
# Open http://localhost:5050 in your Mac browser

# Forward multiple ports at once
ssh -L 5432:localhost:5432 -L 5050:localhost:5050 -L 3000:localhost:3000 homelab
```

## VS Code Remote SSH — Full IDE on Server

Install the **Remote - SSH** extension in VS Code on your Mac:

1. `Cmd+Shift+P` → "Remote-SSH: Connect to Host"
2. Select `homelab`
3. VS Code opens a new window connected to your server
4. You can open `/srv/myapp`, edit files, use the integrated terminal, debug

This is the most productive way to develop on a remote server. Everything works exactly like local development.