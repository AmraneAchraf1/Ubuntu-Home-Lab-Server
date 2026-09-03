---
title: "First Boot & Essential Setup"
order: 3
description: "Essential post-installation steps: system updates, installing tools, preventing laptop sleep on lid close, hostname, timezone, and editor configuration."
---
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

::: info
**Why does this work?** `logind` is the service that manages user sessions and handles hardware events like lid switches, power buttons. By setting all lid actions to `ignore`, we tell it "do nothing when the lid closes". The `systemd-logind` restart applies the new config immediately without rebooting.
:::

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

::: info
**Why?** Without this, some commands that try to resolve the hostname (like `sudo`) will produce warnings like "unable to resolve host homelab". It's a cosmetic issue but annoying.
:::

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

::: info
**Why does timezone matter?** Log files, cron jobs, and database timestamps all use system time. If your timezone is wrong, `2026-05-19 02:00:00` in your logs might actually mean 1:00 AM or 3:00 AM. Debugging becomes a nightmare.
:::

## Configure nano as Default Editor

Many server tools open a text editor. Make sure nano is the default (easier than vim):

```bash
sudo update-alternatives --set editor /usr/bin/nano
echo 'export EDITOR=nano' >> ~/.bashrc
source ~/.bashrc