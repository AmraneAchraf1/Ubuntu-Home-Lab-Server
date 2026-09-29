> **📖 The canonical documentation is the VitePress site under [`docs/`](docs/).**
> It has the full chapter structure, diagrams, search, and dark mode.
> Run `npm run docs:dev` to preview locally, or browse [`docs/chapters/`](docs/chapters/).
> This README is a legacy mirror and will be slimmed down to a short pointer at the end of the documentation project.

[ubuntu_homelab_complete_guide.md](https://github.com/user-attachments/files/28021783/ubuntu_homelab_complete_guide.md)
# 🖥️ Ubuntu Home Lab Server — Complete Setup Guide
### For Full-Stack Engineers (TypeScript · NestJS · React · React Native)
**Hardware:** Intel i5 7th Gen · GTX 1050 Ti 2GB · 500GB Samsung NVMe · 500GB WD HDD · 16GB RAM

> This guide is written to **explain WHY**, not just WHAT to type. Every command is explained so you understand what's happening under the hood. By the end you'll be comfortable managing a Linux server like a professional.

---

## 📋 Table of Contents

1. [Understanding Linux as a Server OS](#chapter-1-understanding-linux-as-a-server-os)
2. [Installation & Disk Partitioning](#chapter-2-installation--disk-partitioning)
3. [First Boot & Essential Setup](#chapter-3-first-boot--essential-setup)
4. [Understanding the Linux Filesystem](#chapter-4-understanding-the-linux-filesystem)
5. [SSH — Remote Access from MacBook](#chapter-5-ssh--remote-access-from-macbook)
6. [Networking & Static IP](#chapter-6-networking--static-ip)
7. [Disk Management — HDD Setup](#chapter-7-disk-management--hdd-setup)
8. [Users, Permissions & Security Basics](#chapter-8-users-permissions--security-basics)
9. [Firewall & Network Security](#chapter-9-firewall--network-security)
10. [Docker — Containers Explained](#chapter-10-docker--containers-explained)
11. [Nginx — Reverse Proxy & SSL](#chapter-11-nginx--reverse-proxy--ssl)
12. [NVIDIA GPU Setup for AI Workloads](#chapter-12-nvidia-gpu-setup-for-ai-workloads)
13. [Node.js & NestJS Deployment](#chapter-13-nodejs--nestjs-deployment)
14. [PostgreSQL & Database Management](#chapter-14-postgresql--database-management)
15. [OpenFoodFacts Data Pipeline](#chapter-15-openfoodfacts-data-pipeline)
16. [Process Management with PM2](#chapter-16-process-management-with-pm2)
17. [Monitoring & Observability](#chapter-17-monitoring--observability)
18. [Backup Strategy & Disaster Recovery](#chapter-18-backup-strategy--disaster-recovery)
19. [Advanced Security Hardening](#chapter-19-advanced-security-hardening)
20. [Automation & Cron Jobs](#chapter-20-automation--cron-jobs)
21. [Tmux — Terminal Multiplexer](#chapter-21-tmux--terminal-multiplexer)
22. [Git Workflow on the Server](#chapter-22-git-workflow-on-the-server)
23. [Environment Variables & Secrets Management](#chapter-23-environment-variables--secrets-management)
24. [Log Management](#chapter-24-log-management)
25. [Performance Tuning](#chapter-25-performance-tuning)
26. [Troubleshooting Guide](#chapter-26-troubleshooting-guide)
27. [Cheatsheet & Quick Reference](#chapter-27-cheatsheet--quick-reference)

---

# Chapter 1: Understanding Linux as a Server OS

## Why Ubuntu Server (Not Desktop)?

When you install Ubuntu **Server**, you get a minimal system with no graphical interface — just a terminal. This might seem scary at first, but it's actually a huge advantage for a home lab:

- **Less RAM wasted** — No desktop environment means more RAM for your apps. A Ubuntu desktop uses ~800MB just sitting idle. Ubuntu Server uses ~200MB.
- **More secure** — Fewer packages = fewer attack surfaces. No browser, no file manager, no Bluetooth stack running unnecessarily.
- **Faster** — No GPU resources spent rendering a desktop. Your GTX 1050 Ti can focus entirely on CUDA/AI work.
- **How real servers work** — Every cloud server (AWS, DigitalOcean, Hetzner) you'll ever deploy to is headless. Learning this now makes you a better engineer.

## How Linux is Different from Windows/Mac

| Concept | Windows | Linux |
|---------|---------|-------|
| File paths | `C:\Users\Ahmed\` | `/home/ahmed/` |
| Admin | Run as Administrator | `sudo` prefix |
| Software install | Download .exe | `apt install package` |
| Services | Task Manager | `systemctl` |
| Config files | Registry + .ini | Plain text files in `/etc/` |
| Everything is... | Files and Registry | **Files** (even hardware!) |

## The `sudo` Command — Understanding Privilege

`sudo` stands for "superuser do". In Linux, the root user (like Administrator in Windows) has full control. Instead of logging in as root (dangerous), you use `sudo` before commands that need elevated privileges.

```bash
# This FAILS — normal user can't install software
apt install nginx

# This WORKS — sudo gives temporary root powers
sudo apt install nginx
```

> **Best practice:** Never log in as root. Always use a regular user + sudo. This way, even if someone hacks your session, they still need your password to do serious damage.

## Package Management with APT

Ubuntu uses APT (Advanced Package Tool) to install software. Think of it like npm but for your entire operating system.

```bash
sudo apt update          # Refresh the list of available packages (like npm registry fetch)
sudo apt upgrade -y      # Install all available updates
sudo apt install nginx   # Install a specific package
sudo apt remove nginx    # Remove a package
sudo apt autoremove      # Remove packages no longer needed
apt search nginx         # Search for packages
apt show nginx           # Show package details
```

> **Why `apt update` before `apt install`?** APT keeps a local cache of available package versions. Without updating, you might install an outdated version. Always run `apt update` first, especially on a fresh install.

## Systemd — The Service Manager

Every long-running process on your server (nginx, ssh, docker) is managed by `systemd`. It starts services on boot, restarts them if they crash, and logs their output.

```bash
sudo systemctl start nginx      # Start a service now
sudo systemctl stop nginx       # Stop it
sudo systemctl restart nginx    # Stop then start
sudo systemctl reload nginx     # Reload config without stopping (graceful)
sudo systemctl enable nginx     # Start automatically at boot
sudo systemctl disable nginx    # Don't start at boot
sudo systemctl status nginx     # Show current status + recent logs
```

Think of `systemctl enable` like adding something to Windows Startup programs.

---

# Chapter 2: Installation & Disk Partitioning

## Understanding Disk Partitioning — The Why

Partitioning means dividing your physical disk into separate logical sections. Each section acts as an independent disk with its own filesystem. Here's why this matters for a server:

**Imagine this scenario:** You have one big `/` partition. Your Docker logs fill up the disk. Now your entire system crashes because there's no space for anything — not even for SSH to write its temporary files. You're locked out.

With separate partitions:
- Docker logs fill up `/var` → only `/var` is full
- Your OS, SSH, and other services still work fine
- You SSH in, clean the logs, and continue

This is why separating `/var`, `/home`, `/srv`, and `/data` is professional practice, not just preference.

## Your Partition Layout Explained

```
Samsung NVMe 500GB (nvme0n1)
├── /boot/efi   512MB  FAT32   ← UEFI bootloader lives here
├── /boot         1GB  ext4    ← Linux kernel & initrd images
├── /             80GB ext4    ← OS root: system binaries, configs
├── /var          50GB ext4    ← Variable data: logs, Docker, apt cache
├── /home         50GB ext4    ← Your personal files, SSH keys, dotfiles
├── /srv          80GB ext4    ← Service data: your NestJS apps, websites
├── swap          16GB swap    ← Virtual RAM (= your physical RAM size)
└── /data        ~188GB ext4   ← Datasets, ML models, backups
```

### What Goes Where?

**`/boot/efi`** — The UEFI firmware needs a FAT32 partition to find the bootloader. This is non-negotiable on modern UEFI systems. 512MB is plenty (it only stores a few MB of bootloader files, but we give it 512MB for safety — this was literally the bug you hit during installation: the old partition was too small).

**`/boot`** — Contains the Linux kernel (`vmlinuz`) and initial RAM disk (`initrd`). When you run `apt upgrade`, new kernel versions are placed here. 1GB is enough for several kernel versions.

**`/` (root)** — The operating system itself. All system binaries (`/usr/bin`), system configs (`/etc`), libraries (`/lib`). 80GB is generous — the base system uses ~5GB, but you want room for packages, pip installs, and npm globals.

**`/var`** — Everything that changes frequently at runtime. This is the most important partition to separate:
- `/var/lib/docker` — All Docker images, containers, volumes (can easily reach 20-40GB)
- `/var/lib/postgresql` — If you run Postgres outside Docker
- `/var/log` — System and application logs
- `/var/cache/apt` — Downloaded packages

**`/home`** — Your user's home directory. Projects you clone with git, your `.bashrc`, `.ssh` keys, NVM, Python virtualenvs. Keeping it separate means you can reinstall the OS without losing your files.

**`/srv`** — Conventionally for "served" data — web apps, API code running as services. Keeping this separate from `/home` is good practice for production-like setups.

**`swap`** — Acts as overflow RAM. When your 16GB RAM fills up, the kernel moves less-used memory pages here. For AI workloads that might spike RAM (loading a large model), having swap prevents OOM (Out of Memory) kills. Match it to your RAM size: 16GB.

**`/data`** — Your personal big storage: the OpenFoodFacts CSV (2GB+), trained models, Parquet files, exports. Keeping this separate makes it easy to mount on the HDD later or expand.

## Filesystem Types Explained

**ext4** — The standard Linux filesystem. Mature, stable, supports files up to 16TB, journaling (crash recovery). Use this for everything except EFI.

**FAT32** — Required for EFI partition. UEFI firmware can only read FAT32.

**swap** — Not really a filesystem — it's raw space the kernel uses as virtual memory.

## Creating Partitions in the Ubuntu Installer

In the installer's "Storage configuration" screen:

1. Select the **free space** under your Samsung NVMe → Enter → **Add GPT Partition**
2. For each partition, fill in:
   - **Size**: exact size (e.g., `512M`, `1G`, `80G`)
   - **Format**: `fat32`, `ext4`, or `swap`
   - **Mount**: `/boot/efi`, `/boot`, `/`, `/var`, `/home`, `/srv`, `/data`
3. For swap: Format = `swap`, no mount point needed

> **Important:** Create them in order from top to bottom. The installer assigns partition numbers sequentially (nvme0n1p1, p2, p3...).

---

# Chapter 3: First Boot & Essential Setup

## What Happens When Linux Boots

Understanding the boot sequence helps you troubleshoot problems:

1. **UEFI firmware** reads `/boot/efi` → finds the GRUB bootloader
2. **GRUB** loads the Linux kernel from `/boot/vmlinuz`
3. **Kernel** initializes hardware, mounts root filesystem
4. **systemd** (PID 1) starts all services in parallel
5. **Login prompt** appears

## First Login

After installation, you'll see a text login prompt. Type your username and password (password is invisible — this is normal in Linux, it's not broken).

```bash
homelab login: labadmin
Password: ████████   ← you won't see anything, just type it
```

## Essential First Commands

```bash
# Always do this first — update everything
sudo apt update && sudo apt upgrade -y
```

Why both commands? `apt update` refreshes the package list from Ubuntu's servers. `apt upgrade` actually downloads and installs the updates. They're separate because sometimes you want to check what's available before installing.

```bash
# Install essential tools
sudo apt install -y \
  curl wget git unzip zip \
  htop iotop nethogs \
  build-essential \
  net-tools \
  tree \
  jq \
  neofetch \
  nano vim
```

What these do:
- `curl wget` — Download files from the internet (you'll use these constantly)
- `git` — Version control (you know this one)
- `htop` — Interactive process viewer (better than `top`)
- `iotop` — Disk I/O monitor per process
- `nethogs` — Network usage per process
- `build-essential` — GCC compiler, make, etc. Required for building many packages from source
- `net-tools` — `ifconfig`, `netstat` commands
- `tree` — Display directory structure as a tree
- `jq` — JSON processor for the command line (amazing for API responses)
- `neofetch` — Shows system info beautifully
- `nano` — Beginner-friendly text editor (vs `vim` which has a learning curve)

## Prevent Lid Close Sleep — Critical for a Laptop Server

This is the most important post-install step. By default, when you close the laptop lid, Ubuntu suspends the system. Your server goes offline. Everyone loses SSH access. Bad.

```bash
sudo nano /etc/systemd/logind.conf
```

Find these lines (use Ctrl+W to search in nano) and change them:

```ini
# Change these from their defaults to 'ignore':
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore
IdleAction=ignore
IdleActionSec=30min
```

Save with `Ctrl+O`, then `Enter`, then exit with `Ctrl+X`.

Apply the changes:
```bash
sudo systemctl restart systemd-logind
```

> **Why does this work?** `logind` is the service that manages user sessions and handles hardware events like lid switches, power buttons. By setting all lid actions to `ignore`, we tell it "do nothing when the lid closes". The `systemd-logind` restart applies the new config immediately without rebooting.

## Set Hostname

```bash
sudo hostnamectl set-hostname homelab
```

Then add it to `/etc/hosts`:
```bash
sudo nano /etc/hosts
```
Add this line:
```
127.0.1.1    homelab
```

> **Why?** Without this, some commands that try to resolve the hostname (like `sudo`) will produce warnings like "unable to resolve host homelab". It's a cosmetic issue but annoying.

## Set Timezone

```bash
# List available timezones
timedatectl list-timezones | grep Africa

# Set yours (Morocco/Algeria area)
sudo timedatectl set-timezone Africa/Casablanca
# or
sudo timedatectl set-timezone Africa/Algiers

# Verify
timedatectl
```

> **Why does timezone matter?** Log files, cron jobs, and database timestamps all use system time. If your timezone is wrong, `2026-05-19 02:00:00` in your logs might actually mean 1:00 AM or 3:00 AM. Debugging becomes a nightmare.

## Configure nano as Default Editor

Many server tools open a text editor. Make sure nano is the default (easier than vim):

```bash
sudo update-alternatives --set editor /usr/bin/nano
echo 'export EDITOR=nano' >> ~/.bashrc
source ~/.bashrc
```

---

# Chapter 4: Understanding the Linux Filesystem

## The Directory Structure Explained

In Linux, everything starts from `/` (root). Unlike Windows with `C:\`, `D:\`, there's only one tree:

```
/
├── bin/        → Essential user commands (ls, cp, mv, cat...)
├── boot/       → Kernel and bootloader files
├── dev/        → Device files (your disks, USB, GPU are here!)
├── etc/        → ALL system configuration files (text files)
├── home/       → User home directories (/home/labadmin)
├── lib/        → Shared libraries (like .dll files in Windows)
├── media/      → Auto-mounted removable media (USB drives)
├── mnt/        → Manual mount points
├── opt/        → Optional software (some apps install here)
├── proc/       → Virtual filesystem — info about running processes
├── root/       → Home directory of the root user
├── run/        → Runtime data (PIDs, sockets)
├── srv/        → Service data (your apps go here)
├── sys/        → Virtual filesystem — hardware info
├── tmp/        → Temporary files (cleared on reboot)
├── usr/        → User programs and data
│   ├── bin/    → Most user commands
│   ├── lib/    → Libraries
│   └── local/  → Locally installed software
└── var/        → Variable runtime data
    ├── log/    → Log files
    ├── lib/    → Application state data
    └── cache/  → Cached data
```

## The `/dev` Directory — Everything is a File

This concept is unique to Unix/Linux and very powerful. Hardware devices are represented as files:

```bash
/dev/nvme0n1      → Your Samsung NVMe SSD
/dev/nvme0n1p1    → First partition on the NVMe
/dev/sda          → Your WD HDD
/dev/sda1         → First partition on the HDD
/dev/sdb          → Your USB drive
/dev/null         → The black hole — anything written here disappears
/dev/random       → Random number generator
/dev/tty          → Current terminal
```

This means you can interact with hardware using standard file operations:

```bash
# Copy an ISO directly to a USB drive (using it as a file!)
sudo dd if=ubuntu.iso of=/dev/sdb bs=4M

# Check disk health by "reading" the device
sudo hdparm -I /dev/sda

# Wipe a disk by writing zeros to it
sudo dd if=/dev/zero of=/dev/sda bs=1M count=100
```

## File Permissions — The Most Important Linux Concept

Every file in Linux has three permission sets: **owner**, **group**, and **others**. Each set has three permissions: **read (r)**, **write (w)**, **execute (x)**.

```bash
ls -la /etc/nginx/nginx.conf
# -rw-r--r-- 1 root root 1447 May 19 10:00 nginx.conf
#  │││││││││
#  │││││││└─ others: r-- (read only)
#  │││││└──── group: r-- (read only)
#  │││└─────── owner: rw- (read + write)
#  ││└──────── type: - (regular file), d (directory), l (symlink)
```

```bash
# Change permissions
chmod 755 script.sh    # owner: rwx, group: r-x, others: r-x
chmod 644 config.txt   # owner: rw-, group: r--, others: r--
chmod +x deploy.sh     # add execute permission for everyone

# Change owner
sudo chown labadmin:labadmin /srv/myapp
sudo chown -R labadmin:labadmin /srv/  # -R = recursive
```

Numeric permissions:
- `7` = rwx (4+2+1)
- `6` = rw- (4+2)
- `5` = r-x (4+1)
- `4` = r-- (4)
- `0` = --- (nothing)

> **Security rule:** Never use `chmod 777`. It gives everyone full access. Use the minimum permissions needed.

---

# Chapter 5: SSH — Remote Access from MacBook

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

> ⚠️ **CRITICAL:** Do NOT close your current SSH session until you verify a new session works. Open a second terminal and test `ssh homelab`. If it works, you're safe. If not, you still have your old session to fix things.

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

---

# Chapter 6: Networking & Static IP

## How Home Network IPs Work

Your router assigns IP addresses using **DHCP** (Dynamic Host Configuration Protocol). When a device connects, the router says "here's your IP: 192.168.1.105, valid for 24 hours". After 24 hours, the device might get a different IP.

This is a problem for a server — your SSH config has `HostName 192.168.1.105`, but tomorrow the server might be `192.168.1.107`. You need a **static IP** that never changes.

## Two Ways to Set Static IP (Use Both)

### Method 1: Router DHCP Reservation (Do This First)

Every home router has a "DHCP reservation" feature. You tell it: "When you see the MAC address `f8:94:c2:6a:5e:50` (your server's WiFi adapter), always assign it `192.168.1.100`."

1. Open your router admin page (usually `192.168.1.1` in browser)
2. Look for "DHCP" → "Static Leases" or "Address Reservation"
3. Add your server's MAC address → assign `192.168.1.100`

Find your server's MAC address:
```bash
ip link show wlp2s0   # your WiFi interface
# shows: link/ether f8:94:c2:6a:5e:50
```

### Method 2: Netplan Static IP (Server-Side Configuration)

Ubuntu uses **Netplan** to manage network interfaces. Config files live in `/etc/netplan/`.

```bash
# Find your config file
ls /etc/netplan/
# Usually: 00-installer-config.yaml

sudo nano /etc/netplan/00-installer-config.yaml
```

For WiFi (your case):
```yaml
network:
  version: 2
  wifis:
    wlp2s0:                          # your WiFi interface name
      dhcp4: no                      # disable automatic IP assignment
      addresses:
        - 192.168.1.100/24           # your desired static IP + subnet mask
      routes:
        - to: default
          via: 192.168.1.1           # your router's IP (gateway)
      nameservers:
        addresses:
          - 8.8.8.8                  # Google DNS
          - 1.1.1.1                  # Cloudflare DNS
          - 9.9.9.9                  # Quad9 DNS (privacy-focused)
      access-points:
        "YourWiFiName":              # your WiFi network name (SSID)
          password: "yourpassword"
```

What does `/24` mean? It's the **subnet mask** in CIDR notation. `/24` = `255.255.255.0`, meaning your network is `192.168.1.0` to `192.168.1.255`. All devices in your home share this range.

Test before applying (auto-reverts after 2 minutes if broken):
```bash
sudo netplan try
# If it works, type 'yes' to keep it
# If it breaks networking, just wait 2 minutes — it reverts automatically
```

Apply permanently:
```bash
sudo netplan apply
```

Verify:
```bash
ip addr show wlp2s0    # should show 192.168.1.100
ping 8.8.8.8           # test internet connectivity
ping google.com        # test DNS resolution
```

## Understanding DNS

When you type `google.com`, your computer asks a DNS (Domain Name System) server: "What IP address is google.com?" The DNS server responds with `142.250.185.46`. This is why we set `nameservers` in the Netplan config.

We use multiple DNS servers as fallback:
- `8.8.8.8` — Google's DNS (fast, reliable)
- `1.1.1.1` — Cloudflare's DNS (privacy-focused, fast)
- `9.9.9.9` — Quad9 (blocks malicious domains)

## Local DNS — Access Server by Name

Add this to `/etc/hosts` on your **MacBook** for easy access:
```
192.168.1.100    homelab homelab.local api.homelab.local
```

Now on your Mac you can access:
- `http://homelab.local` → your server's web UI
- `http://api.homelab.local` → your NestJS API
- `ssh homelab` → SSH shortcut

---

# Chapter 7: Disk Management — HDD Setup

## Understanding Mount Points

In Linux, you don't have drive letters (C:, D:). Instead, you "mount" a disk at a directory. After mounting, everything you write to that directory goes to that disk.

```bash
# After mounting /dev/sda1 at /mnt/storage:
echo "hello" > /mnt/storage/test.txt   # This physically writes to the HDD
echo "hello" > /home/labadmin/test.txt # This writes to the NVMe
```

## Step 1: Partition the HDD

First, check what device name your HDD has:
```bash
lsblk
# Look for the ~500GB disk that's NOT the NVMe
# Usually /dev/sda
```

Create a partition table and single partition:
```bash
sudo fdisk /dev/sda
```

Inside `fdisk`:
```
g    → Create new GPT partition table (erases everything on this disk)
n    → New partition
1    → Partition number 1
     → (press Enter) First sector: default (start of disk)
     → (press Enter) Last sector: default (end of disk, use all space)
w    → Write changes and exit
```

> **Why GPT instead of MBR?** GPT (GUID Partition Table) is the modern standard. It supports disks larger than 2TB, allows more than 4 primary partitions, and is more resilient to corruption. MBR is legacy from the 1980s.

## Step 2: Format the Partition

```bash
sudo mkfs.ext4 -L storage /dev/sda1
# -L storage: give it a label for easy identification
```

This creates an ext4 filesystem on the partition. The `-L` label means you can reference it as `LABEL=storage` instead of `/dev/sda1` (partition names can change, labels don't).

## Step 3: Create Directory Structure

```bash
sudo mkdir -p /mnt/storage
sudo mkdir -p /mnt/storage/datasets
sudo mkdir -p /mnt/storage/backups
sudo mkdir -p /mnt/storage/models
sudo mkdir -p /mnt/storage/exports

# Give your user ownership
sudo chown -R labadmin:labadmin /mnt/storage
```

## Step 4: Auto-Mount at Boot with fstab

`/etc/fstab` (filesystem table) tells Linux what to mount at boot. Without an entry here, you'd have to manually mount the HDD every time you reboot.

```bash
# Get the UUID of your partition
sudo blkid /dev/sda1
# Output: /dev/sda1: LABEL="storage" UUID="a1b2c3d4-e5f6-..." TYPE="ext4"
# Copy the UUID value
```

Edit fstab:
```bash
sudo nano /etc/fstab
```

Add at the bottom:
```
# HDD Storage - /dev/sda1
UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890  /mnt/storage  ext4  defaults,nofail  0  2
```

Breaking down the options:
- `defaults` — Standard mount options (read/write, auto-mount, etc.)
- `nofail` — **Critical!** If the disk is missing, boot continues normally (without this, missing disk = boot failure)
- `0` — Don't backup with dump (obsolete tool, always 0)
- `2` — Check disk with fsck at boot (1 is reserved for root partition)

Test without rebooting:
```bash
sudo mount -a          # Mount everything in fstab
df -h /mnt/storage     # Verify it mounted
ls /mnt/storage        # Should show your subdirectories
```

## Monitoring Disk Space

```bash
df -h                  # All mounted filesystems
df -h /mnt/storage     # Specific partition
du -sh /mnt/storage/*  # Usage by subdirectory
du -sh /* 2>/dev/null  # Usage by top-level directory (ignore errors)

# Find what's eating disk space
du -h /mnt/storage | sort -rh | head -20
```

---

# Chapter 8: Users, Permissions & Security Basics

## User Management

```bash
# Add a new user (useful if you want a deploy user)
sudo adduser deployuser

# Add user to sudo group (admin privileges)
sudo usermod -aG sudo deployuser

# Add user to docker group (can run docker without sudo)
sudo usermod -aG docker labadmin

# Apply group changes without logout
newgrp docker

# See all users
cat /etc/passwd | grep -v nologin

# See groups a user belongs to
groups labadmin

# Switch to another user
su - deployuser

# Delete a user
sudo deluser deployuser
sudo deluser --remove-home deployuser  # also remove home directory
```

## Understanding Groups

Groups allow multiple users to share access to files. For example:
- `docker` group — can run Docker commands
- `sudo` group — can use sudo
- `www-data` group — Nginx runs as this user

```bash
# Create a group
sudo groupadd developers

# Add user to group
sudo usermod -aG developers labadmin

# Set a directory to be accessible by a group
sudo chgrp -R developers /srv/apps
sudo chmod -R g+rwx /srv/apps
```

## The Principle of Least Privilege

Every process and user should have only the minimum permissions needed. This limits damage if something goes wrong.

Examples:
- Nginx runs as `www-data` user (not root) — if hacked, attacker can't access root files
- Your NestJS app doesn't need root — run it as a regular user
- Docker containers run as non-root users (configure this in Dockerfiles)

```bash
# Run a process as a specific user
sudo -u www-data nginx

# Create a service user with no login shell (for running services)
sudo useradd --system --no-create-home --shell /usr/sbin/nologin nestapp
```

---

# Chapter 9: Firewall & Network Security

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

---

# Chapter 10: Docker — Containers Explained

## What is Docker and Why Use It?

Without Docker, installing a Node.js app with Postgres on a server means:
1. Install Node.js (conflicts with system Node?)
2. Install Postgres (configure it, set passwords, create users)
3. Handle environment differences (dev vs prod)
4. App works on your Mac but not the server due to different OS versions

With Docker:
- Each service runs in its own **container** — isolated, with its own dependencies
- A container is like a lightweight VM but shares the kernel
- "It works on my machine" becomes "it works in the container, everywhere"
- Start your entire stack with one command: `docker compose up`

## Core Docker Concepts

**Image** — A read-only template. `postgres:15` is an image. Like a class in OOP.

**Container** — A running instance of an image. Like an object instantiated from a class. Containers are ephemeral — destroying one doesn't affect the image.

**Volume** — Persistent storage attached to a container. When a container is deleted, data in volumes survives.

**Network** — Docker creates virtual networks so containers can communicate. By default, containers in the same `docker-compose.yml` can reach each other by service name.

## Install Docker

```bash
# Remove old/conflicting packages
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key (verify packages are authentic)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Run without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker run hello-world
docker --version
docker compose version
```

## Configure Docker Storage Location

By default, Docker stores everything in `/var/lib/docker`. Since we gave `/var` its own 50GB partition, this is good — Docker data won't overflow into your root partition.

Configure Docker daemon with best practices:
```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

> **Why log limits?** Without limits, Docker container logs can grow indefinitely and fill your disk. `max-size: 10m` means each log file is max 10MB, and `max-file: 3` means only 3 rotated files are kept. Max 30MB per container.

```bash
sudo systemctl restart docker
```

## Your Development Stack with Docker Compose

Create the directory structure:
```bash
mkdir -p ~/docker/stack
nano ~/docker/stack/docker-compose.yml
```

```yaml
version: '3.9'

services:
  # ─── PostgreSQL Database ────────────────────────────────────
  postgres:
    image: postgres:15-alpine          # alpine = smaller image
    container_name: postgres
    restart: unless-stopped            # restart on crash, not on manual stop
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    ports:
      - "127.0.0.1:5432:5432"          # bind to localhost only (safer)
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # run SQL on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d devdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Redis Cache ─────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --requirepass redispass --appendonly yes
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data

  # ─── pgAdmin — Database GUI ──────────────────────────────────
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@homelab.local
      PGADMIN_DEFAULT_PASSWORD: adminpass
      PGADMIN_CONFIG_SERVER_MODE: 'False'   # single-user mode
    ports:
      - "5050:80"
    volumes:
      - pgadmindata:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy        # wait for postgres to be ready

  # ─── Adminer — Lightweight DB GUI ────────────────────────────
  adminer:
    image: adminer:latest
    container_name: adminer
    restart: unless-stopped
    ports:
      - "8080:8080"

volumes:
  pgdata:
  redisdata:
  pgadmindata:
```

```bash
cd ~/docker/stack

# Start everything
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f postgres

# Stop everything
docker compose down

# Stop and DELETE volumes (destroys data!)
docker compose down -v
```

## Useful Docker Commands

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Enter a running container (like SSH into it)
docker exec -it postgres bash
docker exec -it postgres psql -U devuser devdb

# View container logs
docker logs postgres
docker logs -f postgres    # follow mode (like tail -f)
docker logs --tail 50 postgres   # last 50 lines

# Copy file from container to host
docker cp postgres:/etc/postgresql/postgresql.conf ./

# Check container resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Full cleanup (careful! removes everything unused)
docker system prune -a
```

---

# Chapter 11: Nginx — Reverse Proxy & SSL

## What is a Reverse Proxy and Why?

Imagine you have:
- NestJS API on port 3000
- React frontend on port 3001
- pgAdmin on port 5050
- Another service on port 8080

Without Nginx, users need to type `http://192.168.1.100:3000` for the API, `:3001` for frontend, etc.

With Nginx as a reverse proxy:
- `http://api.homelab.local` → forwards to port 3000
- `http://app.homelab.local` → forwards to port 3001
- `http://db.homelab.local` → forwards to port 5050

Nginx sits in front of all services and routes requests based on domain name. Users only ever talk to Nginx (port 80/443). It's like a receptionist who directs visitors to the right department.

Additional benefits:
- **SSL termination** — Nginx handles HTTPS, your apps run plain HTTP internally
- **Load balancing** — Distribute traffic across multiple app instances
- **Caching** — Cache static files at Nginx level
- **Rate limiting** — Protect against DDoS
- **Compression** — Gzip responses to reduce bandwidth

## Install and Configure Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo ufw allow 'Nginx Full'
```

## Configure Virtual Hosts

Each service gets its own config file in `/etc/nginx/sites-available/`:

```bash
sudo nano /etc/nginx/sites-available/nestjs-api
```

```nginx
server {
    listen 80;
    server_name api.homelab.local;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Required for WebSocket support (NestJS often uses this)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Pass real client info to NestJS
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve large file uploads (for your data pipeline)
    client_max_body_size 500M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nestjs-api /etc/nginx/sites-enabled/
sudo nginx -t          # Test config syntax (always do this!)
sudo systemctl reload nginx
```

## Local HTTPS with mkcert

For local development with HTTPS (some browser APIs require it):

```bash
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Create and install local CA
mkcert -install

# Create certificate for your local domains
mkcert homelab.local "*.homelab.local" localhost 127.0.0.1 192.168.1.100
```

Update nginx config to use HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name api.homelab.local;

    ssl_certificate /home/labadmin/homelab.local+3.pem;
    ssl_certificate_key /home/labadmin/homelab.local+3-key.pem;

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.homelab.local;
    return 301 https://$server_name$request_uri;
}
```

---

# Chapter 12: NVIDIA GPU Setup for AI Workloads

## Understanding Your GPU for Server Work

Your **GTX 1050 Ti** has:
- 2GB GDDR5 VRAM
- 768 CUDA cores
- CUDA Compute Capability: 6.1
- Max supported CUDA version: ~12.x

For your use case (data cleaning, Arabic translation of OpenFoodFacts):
- ✅ Small translation models (Helsinki-NLP opus-mt: ~300MB)
- ✅ Sentence embeddings (sentence-transformers: ~200MB)
- ✅ Quantized models Q4 via Ollama (fits in 2GB)
- ⚠️ Mistral 7B Q4: ~4GB — needs CPU fallback
- ❌ Llama 13B+: too large for VRAM

## Install NVIDIA Drivers

```bash
# See what's available
ubuntu-drivers devices

# Install recommended driver automatically
sudo ubuntu-drivers autoinstall

# Or install specific version (535 is stable as of 2026)
sudo apt install -y nvidia-driver-535

# REBOOT REQUIRED
sudo reboot
```

After reboot:
```bash
nvidia-smi
```

You should see your GPU info. This command is your health check for the GPU.

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.x       Driver Version: 535.x     CUDA Version: 12.2        |
|-------------------------------+--------------------+------------------------+
| GPU  Name        Persistence-M| Bus-Id       Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|       Memory-Usage  | GPU-Util  Compute M. |
|   0  NVIDIA GTX 1050 Ti   Off |  00000000:01:00.0 Off|                  N/A |
| 30%   35C    P8    N/A /  75W |   0MiB / 2048MiB    |      0%      Default |
+-----------------------------------------------------------------------------+
```

## Install CUDA Toolkit

```bash
sudo apt install -y nvidia-cuda-toolkit

# Verify
nvcc --version
# nvcc: NVIDIA (R) Cuda compiler driver

# Add CUDA to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

## Install Ollama for Local LLMs

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Verify it uses GPU
ollama run mistral "test"
# In another terminal: nvidia-smi (should show GPU memory being used)

# Models for Arabic translation:
ollama pull aya          # Multilingual model with Arabic support
ollama pull mistral      # General purpose, handles Arabic with prompting

# List downloaded models
ollama list

# Remove a model (free up space)
ollama rm mistral
```

Ollama runs as a service on port 11434:
```bash
sudo systemctl status ollama
curl http://localhost:11434/api/tags   # list models via API
```

## Python GPU Environment

```bash
sudo apt install -y python3 python3-pip python3-venv

# Create isolated environment for AI work
python3 -m venv ~/aienv
source ~/aienv/bin/activate

# Install PyTorch with CUDA support (for CUDA 11.8 compatible with GTX 1050 Ti)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Verify GPU is available
python3 -c "
import torch
print(f'PyTorch version: {torch.__version__}')
print(f'CUDA available: {torch.cuda.is_available()}')
print(f'GPU: {torch.cuda.get_device_name(0)}')
print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
"

# Install NLP and data tools
pip install \
  pandas numpy \
  transformers \
  sentence-transformers \
  datasets \
  pyarrow fastparquet \
  tqdm \
  requests
```

## Managing VRAM with 2GB

2GB VRAM requires careful management:

```python
import torch

# Always clear GPU cache between tasks
torch.cuda.empty_cache()

# Check current VRAM usage
print(f"Allocated: {torch.cuda.memory_allocated(0) / 1024**2:.0f} MB")
print(f"Cached: {torch.cuda.memory_reserved(0) / 1024**2:.0f} MB")

# Use half precision to save VRAM (model uses 2x less memory)
model = model.half()  # float16 instead of float32

# Process in small batches
BATCH_SIZE = 8   # adjust down if you get CUDA out of memory errors

# Context manager to automatically free memory
with torch.no_grad():   # don't track gradients (saves memory)
    outputs = model(inputs)
```

---

# Chapter 13: Node.js & NestJS Deployment

## Install Node.js with NVM

Never install Node.js directly via `apt` — the version is outdated. Use **NVM** (Node Version Manager):

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell config
source ~/.bashrc

# Verify NVM
nvm --version

# Install latest LTS
nvm install --lts
nvm use --lts
nvm alias default node    # make LTS the default

# Verify Node
node --version    # v20.x.x or similar
npm --version

# Install global tools
npm install -g @nestjs/cli pm2 typescript ts-node tsx
```

Why NVM? You might need Node 18 for one project and Node 20 for another. NVM lets you switch instantly:
```bash
nvm install 18
nvm use 18
node --version   # v18.x.x

nvm use 20
node --version   # v20.x.x
```

## Deploy NestJS Application

```bash
# Set up project directory
mkdir -p /srv/apps
cd /srv/apps

# Clone your project
git clone git@github.com:yourusername/your-nestjs-app.git myapp
cd myapp

# Install dependencies (production only)
npm ci --only=production

# Build TypeScript
npm run build

# Test it runs
node dist/main.js
# Ctrl+C to stop
```

## Create a Production `.env` File

Never commit secrets to git. Create a `.env` file on the server:

```bash
nano /srv/apps/myapp/.env
```

```env
# App
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devdb

# Redis
REDIS_URL=redis://:redispass@localhost:6379

# JWT
JWT_SECRET=your-very-long-random-secret-here-change-this
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

Secure the file:
```bash
chmod 600 /srv/apps/myapp/.env    # only owner can read/write
```

## Run with PM2

PM2 (Process Manager 2) keeps your Node.js apps running, restarts them on crashes, and starts them at boot.

```bash
# Start the app
pm2 start dist/main.js --name "myapp" --env production

# Or use an ecosystem file for more control:
nano /srv/apps/myapp/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'myapp',
    script: 'dist/main.js',
    instances: 1,                    // or 'max' to use all CPU cores
    exec_mode: 'fork',               // or 'cluster' for multiple instances
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart if memory exceeds 500MB (memory leak protection)
    max_memory_restart: '500M',
    // Log files
    out_file: '/var/log/myapp/out.log',
    error_file: '/var/log/myapp/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Auto-restart settings
    autorestart: true,
    watch: false,                    // don't watch files in production
    max_restarts: 10,
    min_uptime: '5s'
  }]
};
```

```bash
# Start using ecosystem file
pm2 start ecosystem.config.js --env production

# Save current process list
pm2 save

# Generate startup script (auto-start on boot)
pm2 startup
# Run the command it outputs (starts with 'sudo env PATH=...')

# Useful PM2 commands
pm2 list                    # show all processes
pm2 show myapp              # detailed info
pm2 logs myapp              # view logs
pm2 logs myapp --lines 100  # last 100 lines
pm2 flush                   # clear all logs
pm2 restart myapp           # restart
pm2 reload myapp            # graceful reload (zero downtime)
pm2 stop myapp
pm2 delete myapp
pm2 monit                   # real-time CPU/RAM monitor
```

---

# Chapter 14: PostgreSQL & Database Management

## Connecting to Postgres in Docker

```bash
# Connect directly
docker exec -it postgres psql -U devuser devdb

# Inside psql:
\l          -- list databases
\c devdb    -- connect to database
\dt         -- list tables
\d users    -- describe table 'users'
\q          -- quit
```

## Creating Databases for Different Projects

```bash
docker exec -it postgres psql -U devuser -c "CREATE DATABASE foodfacts;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_prod;"
docker exec -it postgres psql -U devuser -c "CREATE DATABASE myapp_test;"
```

## Backup and Restore

```bash
# Backup a database
docker exec postgres pg_dump -U devuser devdb > \
  /mnt/storage/backups/devdb_$(date +%Y%m%d_%H%M).sql

# Backup all databases
docker exec postgres pg_dumpall -U devuser > \
  /mnt/storage/backups/all_databases_$(date +%Y%m%d).sql

# Restore from backup
cat backup.sql | docker exec -i postgres psql -U devuser devdb

# Compressed backup (much smaller)
docker exec postgres pg_dump -U devuser devdb | gzip > \
  /mnt/storage/backups/devdb_$(date +%Y%m%d).sql.gz

# Restore compressed
gunzip -c backup.sql.gz | docker exec -i postgres psql -U devuser devdb
```

## NestJS TypeORM / Prisma Tips

For TypeORM in NestJS, use connection pooling:
```typescript
// database.config.ts
export const databaseConfig = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    max: 10,          // max connections in pool
    min: 2,           // min connections kept open
    idleTimeoutMillis: 30000,
  },
  synchronize: false,    // NEVER true in production
  migrationsRun: true,   // run migrations automatically
};
```

---

# Chapter 15: OpenFoodFacts Data Pipeline

## Understanding the Dataset

OpenFoodFacts is a crowdsourced database of food products. The full export:
- ~3 million products
- CSV file: ~2GB compressed, ~8GB uncompressed
- Columns: code, product_name, brands, categories, ingredients_text, nutriments, countries, labels...

For your use case: clean the data and add Arabic (`product_name_ar`) using a local GPU model.

## Step 1: Download the Dataset

```bash
mkdir -p /mnt/storage/datasets/openfoodfacts
cd /mnt/storage/datasets/openfoodfacts

# Download (this takes a while — ~2GB)
wget -c https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
# -c = resume if interrupted

# Decompress
gunzip en.openfoodfacts.org.products.csv.gz

# Check size and row count
ls -lh en.openfoodfacts.org.products.csv
wc -l en.openfoodfacts.org.products.csv

# Preview first 2 rows
head -n 2 en.openfoodfacts.org.products.csv | python3 -c "
import sys, csv
reader = csv.reader(sys.stdin)
for row in reader:
    for i, col in enumerate(row[:20]):
        print(f'{i}: {col[:50]}')
    break
"
```

## Step 2: Cleaning Script

```python
# /srv/apps/food_pipeline/01_clean.py
"""
Clean the OpenFoodFacts CSV and save as efficient Parquet format.
Parquet vs CSV:
- Parquet: columnar storage, compressed, 10x faster queries, 5x smaller
- CSV: text, slow to parse, large
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

INPUT  = Path('/mnt/storage/datasets/openfoodfacts/en.openfoodfacts.org.products.csv')
OUTPUT = Path('/mnt/storage/datasets/openfoodfacts/clean.parquet')

USEFUL_COLS = [
    'code', 'product_name', 'brands', 'categories',
    'ingredients_text', 'countries', 'labels',
    'energy_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g',
    'fiber_100g', 'sugars_100g', 'salt_100g',
    'image_url', 'url'
]

def clean_chunk(df):
    # Drop rows with no product name (useless)
    df = df.dropna(subset=['product_name'])
    # Clean whitespace
    df['product_name'] = df['product_name'].str.strip()
    # Remove empty strings
    df = df[df['product_name'].str.len() > 0]
    # Remove duplicate barcodes within chunk
    df = df.drop_duplicates(subset=['code'])
    # Convert numeric columns
    numeric_cols = [c for c in USEFUL_COLS if c.endswith('_100g')]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

chunks = []
total_rows = 0
log.info("Loading dataset in chunks...")

for i, chunk in enumerate(pd.read_csv(
    INPUT,
    usecols=[c for c in USEFUL_COLS if c != 'url'],
    chunksize=50_000,
    low_memory=False,
    on_bad_lines='skip',
    encoding='utf-8',
    encoding_errors='replace'
)):
    cleaned = clean_chunk(chunk)
    chunks.append(cleaned)
    total_rows += len(cleaned)
    if i % 10 == 0:
        log.info(f"  Processed {i * 50_000:,} rows, kept {total_rows:,}...")

log.info("Merging chunks...")
df = pd.concat(chunks, ignore_index=True)
df = df.drop_duplicates(subset=['code'])

log.info(f"Final dataset: {len(df):,} products")
log.info(f"Saving to Parquet...")
df.to_parquet(OUTPUT, index=False, compression='snappy')
log.info(f"Done! Saved to {OUTPUT}")
log.info(f"File size: {OUTPUT.stat().st_size / 1024**2:.1f} MB")
```

## Step 3: Arabic Translation Script

```python
# /srv/apps/food_pipeline/02_translate.py
"""
Translate product names to Arabic using local Ollama model.
Designed for 2GB VRAM — processes in small batches.
"""
import pandas as pd
import requests
import json
import time
import logging
from pathlib import Path
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

INPUT  = Path('/mnt/storage/datasets/openfoodfacts/clean.parquet')
OUTPUT = Path('/mnt/storage/datasets/openfoodfacts/with_arabic.parquet')

OLLAMA_URL = 'http://localhost:11434/api/generate'
MODEL = 'aya'
BATCH_SIZE = 5      # small batches for 2GB VRAM
CHECKPOINT_EVERY = 100  # save progress every 100 batches

def translate_batch(names: list[str]) -> list[str]:
    """Translate a batch of product names to Arabic."""
    prompt = """Translate these food product names to Arabic.
Return ONLY a JSON array of strings, no other text.
Keep brand names as-is (don't translate proper nouns).
Example input: ["Coca Cola", "Whole Milk", "Dark Chocolate"]
Example output: ["كوكا كولا", "حليب كامل الدسم", "شوكولاتة داكنة"]

Now translate:
""" + json.dumps(names)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={'model': MODEL, 'prompt': prompt, 'stream': False},
            timeout=60
        )
        result = response.json()['response'].strip()
        # Clean up response — model sometimes adds backticks
        result = result.replace('```json', '').replace('```', '').strip()
        translations = json.loads(result)
        if len(translations) == len(names):
            return translations
        else:
            log.warning(f"Got {len(translations)} translations for {len(names)} inputs")
            return names  # return originals on mismatch
    except Exception as e:
        log.error(f"Translation error: {e}")
        return names  # return originals on error

# Load data
log.info("Loading cleaned dataset...")
df = pd.read_parquet(INPUT)
log.info(f"Total products: {len(df):,}")

# Check for existing progress
if OUTPUT.exists():
    existing = pd.read_parquet(OUTPUT)
    processed_count = existing['product_name_ar'].notna().sum()
    log.info(f"Resuming from {processed_count:,} already translated")
    df = df.copy()
    df['product_name_ar'] = existing.get('product_name_ar', pd.NA)
else:
    df['product_name_ar'] = pd.NA

# Only translate what's missing
to_translate = df[df['product_name_ar'].isna()].index.tolist()
log.info(f"Need to translate: {len(to_translate):,} products")

# Process in batches
for i in tqdm(range(0, len(to_translate), BATCH_SIZE), desc="Translating"):
    batch_indices = to_translate[i:i + BATCH_SIZE]
    batch_names = df.loc[batch_indices, 'product_name'].tolist()

    translations = translate_batch(batch_names)
    df.loc[batch_indices, 'product_name_ar'] = translations

    # Save checkpoint
    if (i // BATCH_SIZE) % CHECKPOINT_EVERY == 0:
        df.to_parquet(OUTPUT, index=False, compression='snappy')
        log.info(f"Checkpoint saved at {i:,}/{len(to_translate):,}")

    time.sleep(0.1)  # small delay to avoid overwhelming GPU

# Final save
df.to_parquet(OUTPUT, index=False, compression='snappy')
log.info(f"Complete! {len(df):,} products with Arabic names saved to {OUTPUT}")
```

Run the pipeline:
```bash
source ~/aienv/bin/activate
python3 /srv/apps/food_pipeline/01_clean.py
python3 /srv/apps/food_pipeline/02_translate.py
```

---

# Chapter 16: Process Management with PM2

## Understanding Why PM2 is Essential

When you run `node dist/main.js` in a terminal and close the terminal, the process dies. PM2 decouples your process from the terminal session.

```bash
# Install PM2 globally
npm install -g pm2

# Basic usage
pm2 start dist/main.js --name "api"
pm2 list
pm2 logs api
pm2 stop api
pm2 restart api
pm2 delete api
```

## PM2 Cluster Mode for Multi-Core

Your i5 7th gen has 4 cores. Use them all:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/main.js',
    instances: 'max',     // use all available CPUs
    exec_mode: 'cluster', // Node.js cluster mode
    // PM2 load balances requests across instances
  }]
}
```

But be careful with cluster mode: if your app keeps state in memory (like a WebSocket map), cluster mode will break it because instances don't share memory. Use Redis for shared state.

## Zero-Downtime Deployment

```bash
# Instead of restart (which causes downtime):
pm2 restart api

# Use reload (graceful — waits for current requests to finish):
pm2 reload api
```

---

# Chapter 17: Monitoring & Observability

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
```

---

# Chapter 18: Backup Strategy & Disaster Recovery

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
```

---

# Chapter 19: Advanced Security Hardening

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
```

---

# Chapter 20: Automation & Cron Jobs

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
```

---

# Chapter 21: Tmux — Terminal Multiplexer

## Why Tmux?

When your SSH connection drops, every terminal process you had running dies. If you were running a 6-hour data cleaning job, it's gone.

Tmux runs a persistent terminal server on your server. Your sessions survive disconnects. You can detach and reattach from any device.

```bash
sudo apt install -y tmux

# Create a new session
tmux new -s main

# Detach (session keeps running)
Ctrl+B, D

# List sessions
tmux ls

# Reattach
tmux attach -t main
# or just
tmux a     # attach to most recent
```

## Tmux Cheatsheet

All tmux commands start with the **prefix**: `Ctrl+B`

```
# Sessions
Ctrl+B, D           Detach from session
Ctrl+B, $           Rename session
Ctrl+B, (           Switch to previous session
Ctrl+B, )           Switch to next session
Ctrl+B, s           List all sessions (interactive)

# Windows (like browser tabs)
Ctrl+B, c           Create new window
Ctrl+B, ,           Rename current window
Ctrl+B, n           Next window
Ctrl+B, p           Previous window
Ctrl+B, 0-9         Switch to window by number
Ctrl+B, w           List all windows

# Panes (split screen)
Ctrl+B, %           Split vertically (side by side)
Ctrl+B, "           Split horizontally (top/bottom)
Ctrl+B, Arrow       Move to pane
Ctrl+B, z           Zoom/unzoom current pane (fullscreen)
Ctrl+B, x           Close current pane
Ctrl+B, {           Move pane left
Ctrl+B, }           Move pane right

# Scrolling
Ctrl+B, [           Enter copy/scroll mode
Arrow keys / PgUp   Scroll
q                   Exit scroll mode
```

## Custom Tmux Config

```bash
nano ~/.tmux.conf
```

```bash
# Change prefix to Ctrl+A (easier to reach)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Enable mouse support (click to switch panes, scroll)
set -g mouse on

# Start windows and panes at 1, not 0
set -g base-index 1
setw -g pane-base-index 1

# Status bar
set -g status-style bg=colour234,fg=colour255
set -g status-left '#[fg=colour82][#S] '
set -g status-right '#[fg=colour82]%H:%M #[fg=colour255]%Y-%m-%d'

# Increase history
set -g history-limit 50000
```

Apply: `tmux source ~/.tmux.conf`

---

# Chapter 22: Git Workflow on the Server

## SSH Key for GitHub

Generate a dedicated key for your server:

```bash
ssh-keygen -t ed25519 -C "homelab-server-$(date +%Y)" -f ~/.ssh/github_homelab
```

Add to `~/.ssh/config`:
```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_homelab
```

Add the public key to GitHub:
```bash
cat ~/.ssh/github_homelab.pub
# Copy output → GitHub.com → Settings → SSH Keys → New SSH Key
```

Test:
```bash
ssh -T git@github.com
# Hi username! You've successfully authenticated
```

## Deployment with Git Hooks

Git hooks run scripts automatically on git events. Use `post-receive` for auto-deploy:

```bash
# On server — create a bare repository
mkdir -p /srv/git/myapp.git
cd /srv/git/myapp.git
git init --bare

# Create post-receive hook
nano hooks/post-receive
```

```bash
#!/bin/bash
GIT_WORK_TREE=/srv/apps/myapp
GIT_DIR=/srv/git/myapp.git

echo "Deploying to $GIT_WORK_TREE..."
git --work-tree="$GIT_WORK_TREE" --git-dir="$GIT_DIR" checkout -f main

cd $GIT_WORK_TREE
npm ci --only=production
npm run build
pm2 reload myapp

echo "Deploy complete!"
```

```bash
chmod +x hooks/post-receive
```

On your **Mac**, add the server as a git remote:
```bash
git remote add homelab labadmin@homelab:/srv/git/myapp.git
git push homelab main
# This triggers the hook and deploys automatically!
```

---

# Chapter 23: Environment Variables & Secrets Management

## Never Hardcode Secrets

```bash
# Bad - secret in code (NEVER DO THIS)
const db = new Pool({ password: "mypassword" })

# Good - read from environment
const db = new Pool({ password: process.env.DB_PASSWORD })
```

## .env Files and Security

```bash
# Create .env with strict permissions
nano /srv/apps/myapp/.env
chmod 600 /srv/apps/myapp/.env   # only owner can read
chown labadmin:labadmin /srv/apps/myapp/.env
```

Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> /srv/apps/myapp/.gitignore
echo ".env.*" >> /srv/apps/myapp/.gitignore
echo "!.env.example" >> /srv/apps/myapp/.gitignore
```

Create a `.env.example` with placeholder values:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=generate-a-random-secret-here
```

## Generate Strong Secrets

```bash
# Generate a 64-char random string (perfect for JWT secrets)
openssl rand -base64 48

# Generate a UUID
python3 -c "import uuid; print(uuid.uuid4())"

# Generate a random hex string
openssl rand -hex 32
```

---

# Chapter 24: Log Management

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
```

---

# Chapter 25: Performance Tuning

## Kernel Parameters for a Server

```bash
sudo nano /etc/sysctl.d/99-server-tuning.conf
```

```ini
# Increase file descriptor limits (needed for many connections)
fs.file-max = 2097152

# Network performance
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535

# TCP keepalive (detect dead connections faster)
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10

# Swap behavior (0=avoid swap, 100=use swap aggressively)
# For a server with AI workloads, prefer RAM but allow swap
vm.swappiness = 10

# Improve I/O throughput for NVMe
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
```

Apply:
```bash
sudo sysctl -p /etc/sysctl.d/99-server-tuning.conf
```

## Increase File Descriptor Limits

```bash
sudo nano /etc/security/limits.conf
```
Add:
```
labadmin soft nofile 65536
labadmin hard nofile 65536
* soft nofile 65536
* hard nofile 65536
```

---

# Chapter 26: Troubleshooting Guide

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
```

---

# Chapter 27: Cheatsheet & Quick Reference

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
