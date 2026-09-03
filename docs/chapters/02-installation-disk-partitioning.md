---
title: "Installation & Disk Partitioning"
order: 2
description: "Complete guide to disk partitioning for Ubuntu Server including partition layout, filesystem types (ext4, FAT32, swap), and step-by-step installer instructions."
---
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

::: warning
**Important:** Create them in order from top to bottom. The installer assigns partition numbers sequentially (nvme0n1p1, p2, p3...).
:::