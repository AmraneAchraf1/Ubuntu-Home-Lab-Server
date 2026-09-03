---
layout: home

hero:
  name: Ubuntu Home Lab Server
  text: Complete Setup Guide
  tagline: Production-ready home server with Node.js, NestJS, Docker, PostgreSQL, NVIDIA GPU, and more
  image:
    src: /logo.svg
    alt: Ubuntu Home Lab Server
  actions:
    - theme: brand
      text: Get Started
      link: /chapters/01-understanding-linux-as-a-server-os
    - theme: alt
      text: View on GitHub
      link: https://github.com/Ubuntu-HL/Ubuntu-Home-Lab-Server

features:
  - title: 🐧 Linux Fundamentals
    details: Master Ubuntu Server from installation to advanced configuration. Learn partitioning, filesystems, users, permissions, and SSH.
  - title: 🔒 Security First
    details: Harden your server with UFW firewall, Fail2ban, SSH hardening, AppArmor, auditd, and file integrity monitoring.
  - title: 🐳 Modern Stack
    details: Deploy with Docker Compose, Nginx reverse proxy, SSL certificates, PM2 process management, and PostgreSQL.
  - title: 🤖 AI Ready
    details: Set up NVIDIA GPU with CUDA, Ollama for local LLMs, and Python environment for AI/ML workloads.
  - title: 📊 Observability
    details: Monitor with htop, journalctl, custom health checks, disk alerts, and log rotation.
  - title: 🛠️ Dev Experience
    details: Tmux sessions, Git hooks for auto-deploy, environment management, and comprehensive troubleshooting.
---

## Hardware Specifications

| Component | Specification |
|-----------|---------------|
| **CPU** | Intel Core i5 7th Gen (4 cores) |
| **GPU** | NVIDIA GTX 1050 Ti 2GB VRAM |
| **Storage (OS)** | Samsung 500GB NVMe SSD |
| **Storage (Data)** | WD 500GB HDD |
| **RAM** | 16GB DDR4 |
| **OS** | Ubuntu Server 24.04 LTS |

## Quick Navigation

<div class="vp-doc">
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 2rem;">
    <a href="/chapters/01-understanding-linux-as-a-server-os" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">1. Understanding Linux as a Server OS</p>
      <p>Why Ubuntu Server, sudo, APT, and systemd basics</p>
    </a>
    <a href="/chapters/02-installation-disk-partitioning" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">2. Installation & Disk Partitioning</p>
      <p>Partition layout, filesystem types, and installer guide</p>
    </a>
    <a href="/chapters/05-ssh-remote-access-from-macbook" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">5. SSH Remote Access</p>
      <p>Key auth, config, port forwarding, VS Code Remote</p>
    </a>
    <a href="/chapters/10-docker-containers-explained" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">10. Docker & Containers</p>
      <p>Core concepts, installation, and dev stack compose</p>
    </a>
    <a href="/chapters/12-nvidia-gpu-setup-for-ai-workloads" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">12. NVIDIA GPU for AI</p>
      <p>Drivers, CUDA, Ollama, PyTorch, VRAM management</p>
    </a>
    <a href="/chapters/27-cheatsheet-quick-reference" class="custom-block tip" style="text-decoration: none; color: inherit;">
      <p class="custom-block-title">27. Cheatsheet & Quick Reference</p>
      <p>Essential commands, aliases, and health check script</p>
    </a>
  </div>
</div>

## Project Status

- ✅ **27 Chapters** - Complete guide from installation to production
- ✅ **VitePress Documentation** - Modern, fast, searchable docs
- ✅ **Production Ready** - Battle-tested configurations
- 🔄 **Actively Maintained** - Updated for Ubuntu 24.04 LTS

---

*Built with ❤️ for developers who want to run their own infrastructure.*