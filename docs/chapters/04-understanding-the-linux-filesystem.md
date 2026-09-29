---
title: "Understanding the Linux Filesystem"
order: 4
description: "Deep dive into Linux directory structure (/bin, /etc, /home, /var, /dev), device files concept, and file permissions (chmod, chown, numeric modes)."
difficulty: Beginner
estimatedTime: 20 min
prerequisites:
  - "A shell on the server (console or SSH)"
  - "Chapter 3 concepts: a named, time-correct, patched server"
---

<ChapterMeta />

## TL;DR

- **Linux has one tree, rooted at `/`.** Every disk, USB stick, and device appears *inside* that tree — there are no `C:` drive letters.
- **Each top-level directory has a job:** `/etc` = config, `/var` = changing data, `/home` = your files, `/srv` = services, `/proc` + `/sys` = virtual views of the kernel.
- **In `/dev`, hardware is a file.** You can `dd` to a USB drive or read a disk's health because the device *is* a path.
- **Permissions are three sets of three bits** — owner, group, others × read, write, execute — shown as `-rw-r--r--` or numerically as `644`.
- **Never use `chmod 777`.** Grant the minimum needed; the whole security model depends on it.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| A shell on the server | You'll inspect the tree and permissions. |
| Chapter 3 done | A patched, named server is the assumed base. |

## The Directory Structure Explained

In Linux, everything starts from `/` (root). Unlike Windows with `C:\`, `D:\`, there's only one tree:

```
/
├── bin/        → Essential user commands (ls, cp, mv, cat...)
├── boot/       → Kernel and bootloader files
├── dev/        → Device files (your disks, USB, GPU are here!)
├── etc/        → ALL system configuration files (text files)
├── home/       → User home directories (/home/ahmed)
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

```mermaid
flowchart TD
  ROOT[/]
  ROOT --> ETC[/etc<br/>configuration]
  ROOT --> VAR[/var<br/>changing data]
  ROOT --> HOME[/home<br/>user files]
  ROOT --> SRV[/srv<br/>service data]
  ROOT --> BOOT[/boot<br/>kernel]
  ROOT --> VIRT{Virtual — kernel views}
  VIRT --> PROC[/proc]
  VIRT --> SYS[/sys]
  VIRT --> DEV[/dev<br/>devices as files]
```

<p class="ahl-diagram-caption"><strong>Figure 4.1</strong> — The directories you'll actually touch. `/etc` and `/var` are where you'll spend most of your debugging time.</p>

::: details Why this matters — separating config from state
`/etc` holds *configuration* (what the system should do); `/var` holds *state* (what it has done — logs, databases, caches). Keeping them apart is why you can back up `/etc`, wipe `/var`, and bring a service back with the same behaviour. It's also why a full `/var` (Chapter 2) doesn't corrupt your config.
:::

## The `/dev` Directory — Everything is a File

This concept is unique to Unix/Linux and very powerful. Hardware devices are represented as files:

```bash [devices.txt]
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

```bash [dd-and-hdparm.sh]
# Copy an ISO directly to a USB drive (using it as a file!)
sudo dd if=ubuntu.iso of=/dev/sdb bs=4M

# Check disk health by "reading" the device
sudo hdparm -I /dev/sda

# Wipe a disk by writing zeros to it
sudo dd if=/dev/zero of=/dev/sda bs=1M count=100
```

```mermaid
flowchart LR
  subgraph Userspace
    DD[dd if=ubuntu.iso of=/dev/sdb]
    NULL[echo x > /dev/null]
  end
  subgraph Kernel["/dev — device nodes"]
    SDB[/dev/sdb]
    DEVNULL[/dev/null]
  end
  subgraph Hardware
    USB[(USB drive)]
    GONE[(discarded)]
  end
  DD --> SDB --> USB
  NULL --> DEVNULL --> GONE
```

<p class="ahl-diagram-caption"><strong>Figure 4.2</strong> — "Everything is a file": a normal file write (`dd`, `echo`) reaches real hardware because the device is a path.</p>

::: warning `dd` is unforgiving
`dd` has no "are you sure?" prompt and no undo. A swapped `if`/`of` can overwrite your system disk. Always double-check the target device with `lsblk` immediately before running it.
:::

## File Permissions — The Most Important Linux Concept

Every file in Linux has three permission sets: **owner**, **group**, and **others**. Each set has three permissions: **read (r)**, **write (w)**, **execute (x)**.

```bash [ls-permissions.sh]
ls -la /etc/nginx/nginx.conf
# -rw-r--r-- 1 root root 1447 May 19 10:00 nginx.conf
#  │││││││││
#  │││││││└─ others: r-- (read only)
#  ││││││└─── group: r-- (read only)
#  │││││└──── owner: rw- (read + write)
#  ││└──────── type: - (regular file), d (directory), l (symlink)
```

<figure>
  <svg viewBox="0 0 720 260" role="img" aria-label="Breakdown of the permission string dash r w dash r dash dash r dash dash into type, owner, group and others" width="100%" style="max-width:720px;height:auto;border-radius:10px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);padding:1rem;box-sizing:border-box;font-family:'JetBrains Mono',ui-monospace,monospace;">
    <text x="16" y="30" font-size="13" font-weight="700" fill="var(--vp-c-text-1)" font-family="Inter,system-ui,sans-serif">Reading -rw-r--r--</text>
    <g font-size="26" fill="var(--vp-c-text-1)">
      <text x="20" y="90">-</text>
      <text x="60" y="90">r</text><text x="92" y="90">w</text><text x="124" y="90">-</text>
      <text x="164" y="90">r</text><text x="196" y="90">-</text><text x="228" y="90">-</text>
      <text x="268" y="90">r</text><text x="300" y="90">-</text><text x="332" y="90">-</text>
    </g>
    <g stroke="var(--vp-c-text-3)" stroke-dasharray="3 3">
      <line x1="20" y1="100" x2="20" y2="130"></line>
      <line x1="124" y1="100" x2="124" y2="130"></line>
      <line x1="228" y1="100" x2="228" y2="130"></line>
      <line x1="332" y1="100" x2="332" y2="130"></line>
    </g>
    <g font-size="12" fill="var(--vp-c-brand-1)" font-family="Inter,system-ui,sans-serif">
      <text x="12" y="150">type</text>
      <text x="52" y="150">owner</text>
      <text x="156" y="150">group</text>
      <text x="260" y="150">others</text>
    </g>
    <g font-size="11.5" fill="var(--vp-c-text-3)" font-family="Inter,system-ui,sans-serif">
      <text x="12" y="172">- file</text>
      <text x="12" y="188">d dir</text>
      <text x="12" y="204">l link</text>
      <text x="52" y="172">rw- = read+write</text>
      <text x="156" y="172">r-- = read only</text>
      <text x="260" y="172">r-- = read only</text>
    </g>
    <text x="16" y="240" font-size="12" fill="var(--vp-c-text-2)" font-family="Inter,system-ui,sans-serif">Numeric: 6 (rw-) + 4 (r--) + 4 (r--) = 644</text>
  </svg>
  <figcaption><strong>Figure 4.3</strong> — A permission string is three triads: owner, group, others. Each triad is r/w/x, worth 4/2/1.</figcaption>
</figure>

```bash [chmod-chown.sh]
# Change permissions
chmod 755 script.sh    # owner: rwx, group: r-x, others: r-x
chmod 644 config.txt   # owner: rw-, group: r--, others: r--
chmod +x deploy.sh     # add execute permission for everyone

# Change owner
sudo chown ahmed:ahmed /srv/myapp
sudo chown -R ahmed:ahmed /srv/  # -R = recursive
```

Numeric permissions:

| Value | Bits | Meaning |
|-------|------|---------|
| `7` | rwx | read + write + execute (4+2+1) |
| `6` | rw- | read + write (4+2) |
| `5` | r-x | read + execute (4+1) |
| `4` | r-- | read only (4) |
| `0` | --- | no permissions |

::: tip
**Security rule:** Never use `chmod 777`. It gives everyone full access. Use the minimum permissions needed.
:::

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| The tree is one root | `ls -la /` | directories like `etc`, `var`, `home`, `dev` |
| Devices are files | `ls -l /dev/null` | `crw-rw-rw- … /dev/null` |
| Read a permission string | `ls -l /etc/hosts` | `-rw-r--r-- … /etc/hosts` |
| Numeric permissions | `stat -c '%a %n' /etc/hosts` | `644 /etc/hosts` |
| `chmod` works | see below | `-rwxr-xr-x` |

```bash [verify.sh]
ls -l /dev/null                       # → crw-rw-rw- 1 root root ... /dev/null
stat -c '%a %n' /etc/hosts            # → 644 /etc/hosts
touch /tmp/permtest.sh && chmod 755 /tmp/permtest.sh && ls -l /tmp/permtest.sh
# → -rwxr-xr-x 1 ahmed ahmed 0 ... /tmp/permtest.sh
```

## Common pitfalls

::: warning Top 3 failure modes
1. **`chmod 777` as a "fix".** It hides the real ownership problem and opens the file to every user on the box. Fix the owner/group instead.
2. **`chown -R` on the wrong path.** Recursive ownership changes can lock you out of `/` or `/etc`. Always target a specific directory and re-read the command before Enter.
3. **Misreading the triads.** People read `-rw-r--r--` left-to-right as one blob. Read it as *three* sets: owner, group, others.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Permission denied` reading a file | You're not owner and the file lacks group/other read | Check `ls -l`; use `sudo`, or fix ownership with `chown` |
| `bash: ./script.sh: Permission denied` | Script isn't executable | `chmod +x script.sh` |
| Service can't write its data dir | Wrong owner/group on the directory | `chown` the directory to the service user (e.g. `www-data`) |
| `chown: invalid user` | Typo or missing user | Verify with `id <user>` first |
| `No space left` on a full disk | `/var` or `/tmp` filled | See disk troubleshooting in [Chapter 26](/chapters/26-troubleshooting-guide) |

## Recap & next

You can now read the filesystem like a map: config in `/etc`, state in `/var`, your stuff in `/home`, services in `/srv`, hardware as files in `/dev` — and you can decode and set permissions with confidence.

Next: **[Chapter 5 — SSH: Remote Access from MacBook](/chapters/05-ssh-remote-access-from-macbook)** — turn this local console into secure remote access.

## References

- [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html) — the canonical definition of every top-level directory.
- [`man hier`](https://manpages.ubuntu.com/manpages/noble/en/man7/hier.7.html) — the filesystem layout as shipped by Ubuntu.
- [`man chmod`](https://manpages.ubuntu.com/manpages/noble/en/man1/chmod.1.html) — symbolic and numeric mode syntax.
- [`man chown`](https://manpages.ubuntu.com/manpages/noble/en/man1/chown.1.html) — ownership and the `-R` flag.
- [`man ls`](https://manpages.ubuntu.com/manpages/noble/en/man1/ls.1.html) — decoding the long listing.
- [`man stat`](https://manpages.ubuntu.com/manpages/noble/en/man2/stat.2.html) — the structure behind `stat` output.
- [`man proc`](https://manpages.ubuntu.com/manpages/noble/en/man5/proc.5.html) — what `/proc` exposes about the running kernel.
