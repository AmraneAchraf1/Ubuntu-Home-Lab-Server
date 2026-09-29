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

## Conventions

- **Mermaid** diagrams live inline in the chapter `.md` and are themed from CSS tokens — no files stored here.
- **SVG** bar/architecture charts are authored in-repo and inlined for theme-awareness.
- **Screenshots / downloads** are stored here, converted to WebP, and capped at 300 KB.
- Every downloaded file must be checked for visible secrets, keys, tokens, or personal data **before** `git add`.
