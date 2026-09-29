# Image credits

Traceability log for every image stored under `docs/public/images/`.
Downloaded assets are recorded with their source and license so we can re-verify or
re-download them later. Authored diagrams (Mermaid/SVG) are noted as "authored in-repo".

## 01-understanding-linux-as-a-server-os

| File | Type | Source | License / credit | Note |
|------|------|--------|------------------|------|
| `systemd-boot.webp` | Screenshot (downloaded) | https://commons.wikimedia.org/wiki/File:Debian_Unstable_Systemd_Boot_(2015).png | CC0 1.0 — author *Huihermit* | Boot-time systemd handoff. Converted PNG → WebP (quality 82). No secrets/personal data present. |
| `Figure 1.1` (inline SVG bar chart) | Authored in-repo | — | — | Idle RAM: Ubuntu Desktop vs Server. Values quoted from this guide's own text. |

## Conventions

- **Mermaid** diagrams live inline in the chapter `.md` and are themed from CSS tokens — no files stored here.
- **SVG** bar/architecture charts are authored in-repo and inlined for theme-awareness.
- **Screenshots / downloads** are stored here, converted to WebP, and capped at 300 KB.
- Every downloaded file must be checked for visible secrets, keys, tokens, or personal data **before** `git add`.
