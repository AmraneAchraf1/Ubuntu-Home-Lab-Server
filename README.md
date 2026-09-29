# Ubuntu Home Lab Server

A production-style home server guide for full-stack engineers — from a bare Ubuntu Server 24.04 install to a hardened, monitored, GPU-capable stack.

> **📖 Documentation site:** all content lives in [`docs/`](docs/) and is published with VitePress.
> Browse [`docs/chapters/`](docs/chapters/) or run the site locally (below).

## What you'll build

A home lab running **Docker Compose**, **Nginx + SSL**, **Node/NestJS under PM2**, **PostgreSQL**, **React**, **UFW/Fail2ban**, and an **NVIDIA GPU / Ollama** pipeline — on:

| Component | Specification |
|-----------|---------------|
| CPU | Intel Core i5 7th Gen (4 cores) |
| GPU | NVIDIA GTX 1050 Ti 2GB |
| Storage | 500GB Samsung NVMe + 500GB WD HDD |
| RAM | 16GB DDR4 |
| OS | Ubuntu Server 24.04 LTS |

## Quick start

```bash
npm install          # install VitePress + Mermaid
npm run docs:dev     # local dev server with hot reload
npm run docs:build   # production build to docs/.vitepress/dist
npm run docs:preview # preview the production build
```

## Repository layout

```
docs/
├── index.md                 # landing page
├── chapters/                # 27 chapters (the guide)
├── public/images/           # figures + CREDITS.md
└── .vitepress/
    ├── config.mts           # nav, sidebar, Mermaid, markdown plugins
    └── theme/               # custom.css design system + Vue components
```

The chapters are the single source of truth. This README is intentionally short; everything else lives in `docs/`.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for the chapter template, visual standards, and reference rules.

## License

Released under the MIT License — see [`LICENSE`](LICENSE).

*Guide tailored for: Intel i5 7th Gen · GTX 1050 Ti · Samsung NVMe 500GB · WD HDD 500GB · 16GB RAM · Ubuntu Server 24.04 LTS*
