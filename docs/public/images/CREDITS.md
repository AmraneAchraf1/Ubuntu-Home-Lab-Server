# Image credits

Traceability log for every image stored under `docs/public/images/`.
Downloaded assets are recorded with their source and license so we can re-verify or
re-download them later. Authored diagrams (Mermaid/SVG) are noted as "authored in-repo".

## 01-understanding-linux-as-a-server-os

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `systemd-boot.webp` | Screenshot (downloaded) | https://commons.wikimedia.org/wiki/File:Debian_Unstable_Systemd_Boot_(2015).png | CC0 1.0 — author *Huihermit* | Boot-time systemd handoff. Converted PNG → WebP (quality 82). No secrets/personal data present. |
| `Figure 1.1` (inline SVG bar chart) | Authored in-repo | — | — | Idle RAM: Ubuntu Desktop vs Server. Values quoted from this guide's own text. |

## 02-installation-disk-partitioning

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 2.1` (Mermaid) | Authored in-repo | — | — | Why separate partitions (blast radius). |
| `Figure 2.2` (inline SVG) | Authored in-repo | — | — | NVMe partition map; sizes from this chapter's layout. |
| `Figure 2.3` (Mermaid) | Authored in-repo | — | — | Installer "Add GPT Partition" loop. |
| `Figure 2.4` (inline SVG) | Authored in-repo | — | — | Annotated recreation of the installer storage screen. No redistributable upstream screenshot found; recreated for accuracy and theme control. No secrets. |

## 03-first-boot-essential-setup

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 3.1` (Mermaid) | Authored in-repo | — | — | Linux boot chain. |
| `Figure 3.2` (inline SVG) | Authored in-repo | — | — | Recreated terminal for the first login. No secrets (example username only). |
| `Figure 3.3` (Mermaid) | Authored in-repo | — | — | Lid-switch decision. |

## 04-understanding-the-linux-filesystem

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 4.1` (Mermaid) | Authored in-repo | — | — | FHS directory map. |
| `Figure 4.2` (Mermaid) | Authored in-repo | — | — | "Everything is a file" device flow. |
| `Figure 4.3` (inline SVG) | Authored in-repo | — | — | Permission string breakdown. |

## 05-ssh-remote-access-from-macbook

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 5.1` (Mermaid) | Authored in-repo | — | — | SSH handshake + fingerprint. |
| `Figure 5.2` (Mermaid) | Authored in-repo | — | — | Key-auth challenge flow. |
| `Figure 5.3` (inline SVG) | Authored in-repo | — | — | Local port-forwarding tunnel. No secrets. |

## 06-networking-static-ip

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 6.1` (Mermaid) | Authored in-repo | — | — | DHCP lease vs static. |
| `Figure 6.2` (inline SVG) | Authored in-repo | — | — | Home network topology. No real MACs/IPs beyond the guide's examples. |
| `Figure 6.3` (Mermaid) | Authored in-repo | — | — | DNS resolution flow. |

## 07-disk-management-hdd-setup

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 7.1` (inline SVG) | Authored in-repo | — | — | Disk → partition → format → mount chain. |
| `Figure 7.2` (Mermaid) | Authored in-repo | — | — | fdisk sequence. |
| `Figure 7.3` (Mermaid) | Authored in-repo | — | — | fstab / nofail boot decision. |

## 08-users-permissions-security-basics

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 8.1` (Mermaid) | Authored in-repo | — | — | User → groups → permissions. |
| `Figure 8.2` (inline SVG) | Authored in-repo | — | — | Least-privilege blast radius. |

## 09-firewall-network-security

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 9.1` (Mermaid) | Authored in-repo | — | — | UFW default posture. |
| `Figure 9.2` (inline SVG) | Authored in-repo | — | — | Public vs LAN-only port exposure. |
| `Figure 9.3` (Mermaid) | Authored in-repo | — | — | Fail2ban ban flow. |

## 10-docker-containers-explained

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 10.1` (Mermaid) | Authored in-repo | — | — | Image/container/volume model. |
| `Figure 10.2` (Mermaid) | Authored in-repo | — | — | Compose stack topology. |

## 11-nginx-reverse-proxy-ssl

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 11.1` (Mermaid) | Authored in-repo | — | — | Domain-based routing. |
| `Figure 11.2` (Mermaid) | Authored in-repo | — | — | Request flow browser→Nginx→app→DB. |
| `Figure 11.3` (inline SVG) | Authored in-repo | — | — | SSL termination. |

## 12-nvidia-gpu-setup-for-ai-workloads

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 12.1` (Mermaid) | Authored in-repo | — | — | GPU software stack. |
| `Figure 12.2` (inline SVG) | Authored in-repo | — | — | 2 GB VRAM budget. |

## 13-nodejs-nestjs-deployment

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 13.1` (Mermaid) | Authored in-repo | — | — | Deploy pipeline. |
| `Figure 13.2` (Mermaid) | Authored in-repo | — | — | PM2 supervision loop. |

## 14-postgresql-database-management

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 14.1` (Mermaid) | Authored in-repo | — | — | Backup/restore cycle. |
| `Figure 14.2` (inline SVG) | Authored in-repo | — | — | Connection pooling. |

## 15-openfoodfacts-data-pipeline

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 15.1` (Mermaid) | Authored in-repo | — | — | Two-stage pipeline flow. |
| `Figure 15.2` (inline SVG) | Authored in-repo | — | — | Data-size funnel (illustrative). |

## 16-process-management-with-pm2

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 16.1` (Mermaid) | Authored in-repo | — | — | Cluster mode + shared state. |
| `Figure 16.2` (inline SVG) | Authored in-repo | — | — | reload vs restart downtime. |

## 17-monitoring-observability

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 17.1` (Mermaid) | Authored in-repo | — | — | Observability layers. |
| `Figure 17.2` (Mermaid) | Authored in-repo | — | — | Disk-alert loop. |

## 18-backup-strategy-disaster-recovery

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 18.1` (inline SVG) | Authored in-repo | — | — | 3-2-1 backup rule. |
| `Figure 18.2` (Mermaid) | Authored in-repo | — | — | Backup script flow. |

## 19-advanced-security-hardening

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 19.1` (Mermaid) | Authored in-repo | — | — | Defense-in-depth layers. |
| `Figure 19.2` (inline SVG) | Authored in-repo | — | — | AIDE baseline vs check. |

## 20-automation-cron-jobs

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 20.1` (inline SVG) | Authored in-repo | — | — | Cron field breakdown. |
| `Figure 20.2` (Mermaid) | Authored in-repo | — | — | cron vs systemd timer. |

## 21-tmux-terminal-multiplexer

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 21.1` (inline SVG) | Authored in-repo | — | — | session/window/pane hierarchy. |
| `Figure 21.2` (Mermaid) | Authored in-repo | — | — | detach/reattach survival. |

## 22-git-workflow-on-the-server

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 22.1` (inline SVG) | Authored in-repo | — | — | push-to-deploy topology. |
| `Figure 22.2` (Mermaid) | Authored in-repo | — | — | deploy sequence. |

## 23-environment-variables-secrets-management

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 23.1` (Mermaid) | Authored in-repo | — | — | Secret flow. |
| `Figure 23.2` (inline SVG) | Authored in-repo | — | — | git-ignored vs committed files. |

## 24-log-management

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 24.1` (inline SVG) | Authored in-repo | — | — | /var/log map. |
| `Figure 24.2` (Mermaid) | Authored in-repo | — | — | logrotate cycle. |

## 25-performance-tuning

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `Figure 25.1` (inline SVG) | Authored in-repo | — | — | Tuning areas. |
| `Figure 25.2` (Mermaid) | Authored in-repo | — | — | Apply flow. |

## Conventions

- **Mermaid** diagrams live inline in the chapter `.md` and are themed from CSS tokens — no files stored here.
- **SVG** bar/architecture charts are authored in-repo and inlined for theme-awareness.
- **Screenshots / downloads** are stored here, converted to WebP, and capped at 300 KB.
- Every downloaded file must be checked for visible secrets, keys, tokens, or personal data **before** `git add`.
