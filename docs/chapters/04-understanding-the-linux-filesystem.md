---
title: "Understanding the Linux Filesystem"
order: 4
description: "Deep dive into Linux directory structure (/bin, /etc, /home, /var, /dev), device files concept, and file permissions (chmod, chown, numeric modes)."
---
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

::: tip
**Security rule:** Never use `chmod 777`. It gives everyone full access. Use the minimum permissions needed.
:::