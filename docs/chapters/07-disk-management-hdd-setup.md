---
title: "Disk Management — HDD Setup"
order: 7
description: "Partition, format, and auto-mount secondary HDD with GPT, ext4, fstab UUID configuration, nofail option, and disk space monitoring commands."
---
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

::: info
**Why GPT instead of MBR?** GPT (GUID Partition Table) is the modern standard. It supports disks larger than 2TB, allows more than 4 primary partitions, and is more resilient to corruption. MBR is legacy from the 1980s.
:::

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