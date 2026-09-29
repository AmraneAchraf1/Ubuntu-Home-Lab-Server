---
title: "Node.js & NestJS Deployment"
order: 13
description: "Node.js with NVM, NestJS deployment with production .env, PM2 process management with ecosystem config, zero-downtime reloads, and auto-start on boot."
difficulty: Intermediate
estimatedTime: 40 min
prerequisites:
  - "A NestJS project in a Git repository"
  - "Postgres and Redis running (Chapter 10)"
  - "Nginx configured to proxy the app (Chapter 11)"
---

<ChapterMeta />

## TL;DR

- **Install Node via NVM, never `apt`** — apt's Node is old and you'll want multiple versions.
- **Deploy with `npm ci` (not `install`)**, then `npm run build` to produce `dist/`.
- **Keep secrets in a `.env` with `chmod 600`** — never in git.
- **PM2 supervises the process:** restart on crash, memory cap, and **auto-start on boot via `pm2 startup` + `pm2 save`**.
- **`pm2 reload` is graceful** (zero-downtime); `pm2 restart` is not.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| A NestJS repo | The app we deploy. |
| Postgres/Redis up | The app connects to them. |
| Nginx site | Public entry point. |

## Step 1 — Install Node.js with NVM

Never install Node.js directly via `apt` — the version is outdated. Use **NVM** (Node Version Manager):

```bash [install-nvm.sh]
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell config
source ~/.bashrc

# Verify NVM
nvm --version

# Install latest LTS
nvm install --lts
nvm use --lts
nvm alias default node    # make LTS the default

# Verify Node
node --version    # v20.x.x or similar
npm --version

# Install global tools
npm install -g @nestjs/cli pm2 typescript ts-node tsx
```

Why NVM? You might need Node 18 for one project and Node 20 for another. NVM lets you switch instantly:

```bash [nvm-switch.sh]
nvm install 18
nvm use 18
node --version   # v18.x.x

nvm use 20
node --version   # v20.x.x
```

## Step 2 — Deploy the NestJS application

**Run** the block. **Expected:** `node dist/main.js` starts the app and logs its listening port; `Ctrl+C` stops it.

```bash [deploy.sh]
# Set up project directory
mkdir -p /srv/apps
cd /srv/apps

# Clone your project
git clone git@github.com:yourusername/your-nestjs-app.git myapp
cd myapp

# Install dependencies (production only)
npm ci --only=production

# Build TypeScript
npm run build

# Test it runs
node dist/main.js
# Ctrl+C to stop
```

```mermaid
flowchart LR
  G[git clone] --> C[npm ci --only=production]
  C --> B[npm run build]
  B --> T[node dist/main.js — test]
  T --> P[pm2 start ecosystem.config.js]
  P --> S[pm2 save]
```

<p class="ahl-diagram-caption"><strong>Figure 13.1</strong> — The deploy pipeline: pull, install exactly-locked deps, compile, test, then hand off to PM2.</p>

::: info `npm ci` vs `npm install`
`npm ci` installs *exactly* what `package-lock.json` pins and fails if they disagree — reproducible, and required for CI/production. `npm install` may update the lockfile and resolve newer versions. Use `ci` on the server.
:::

## Step 3 — Create a production `.env` file

Never commit secrets to git. Create a `.env` file on the server:

```bash [create-env.sh]
nano /srv/apps/myapp/.env
```

```dotenv [.env]
# App
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/devdb

# Redis
REDIS_URL=redis://:redispass@localhost:6379

# JWT
JWT_SECRET=your-very-long-random-secret-here-change-this
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

Secure the file:

```bash [secure-env.sh]
chmod 600 /srv/apps/myapp/.env    # only owner can read/write
```

::: danger Never commit `.env`
A leaked `.env` is a leaked database password and JWT signing key. Keep it out of git (`.gitignore`), `chmod 600` it, and generate secrets with `openssl rand -base64 48` (Chapter 23).
:::

## Step 4 — Run with PM2

PM2 (Process Manager 2) keeps your Node.js apps running, restarts them on crashes, and starts them at boot.

```bash [pm2-start.sh]
# Start the app
pm2 start dist/main.js --name "myapp" --env production

# Or use an ecosystem file for more control:
nano /srv/apps/myapp/ecosystem.config.js
```

```javascript [ecosystem.config.js]
module.exports = {
  apps: [{
    name: 'myapp',
    script: 'dist/main.js',
    instances: 1,                    // or 'max' to use all CPU cores
    exec_mode: 'fork',               // or 'cluster' for multiple instances
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart if memory exceeds 500MB (memory leak protection)
    max_memory_restart: '500M',
    // Log files
    out_file: '/var/log/myapp/out.log',
    error_file: '/var/log/myapp/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Auto-restart settings
    autorestart: true,
    watch: false,                    // don't watch files in production
    max_restarts: 10,
    min_uptime: '5s'
  }]
};
```

```bash [pm2-commands.sh]
# Start using ecosystem file
pm2 start ecosystem.config.js --env production

# Save current process list
pm2 save

# Generate startup script (auto-start on boot)
pm2 startup
# Run the command it outputs (starts with 'sudo env PATH=...')

# Useful PM2 commands
pm2 list                    # show all processes
pm2 show myapp              # detailed info
pm2 logs myapp              # view logs
pm2 logs myapp --lines 100  # last 100 lines
pm2 flush                   # clear all logs
pm2 restart myapp           # restart
pm2 reload myapp            # graceful reload (zero downtime)
pm2 stop myapp
pm2 delete myapp
pm2 monit                   # real-time CPU/RAM monitor
```

```mermaid
flowchart TD
  RUN[App running under PM2] --> Q{Event}
  Q -- crash --> R[autorestart → back online]
  Q -- memory > 500M --> M[max_memory_restart → restart]
  Q -- deploy --> RL[pm2 reload — graceful, no downtime]
  R --> RUN
  M --> RUN
```

<p class="ahl-diagram-caption"><strong>Figure 13.2</strong> — PM2's supervision loop: it reacts to crashes, memory leaks, and deployments so the process is always up.</p>

| Command | Effect |
|---------|--------|
| `pm2 list` | Show all managed processes |
| `pm2 logs <app>` | Tail logs |
| `pm2 reload <app>` | Graceful restart (zero-downtime) |
| `pm2 restart <app>` | Hard restart |
| `pm2 save` | Persist the process list for boot |
| `pm2 startup` | Emit the boot script command |

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Node version | `node --version` | `v20.x` (LTS) |
| App is online | `pm2 list` | `myapp` status `online` |
| App responds | `curl -s localhost:3000` | app response |
| Boot persistence | `pm2 list` after reboot | `myapp` online again |
| Env is locked down | `ls -l /srv/apps/myapp/.env` | `-rw-------` |

```bash [verify.sh]
node --version
pm2 list
curl -sI http://localhost:3000 | head -1
ls -l /srv/apps/myapp/.env
```

## Common pitfalls

::: warning Top 3 failure modes
1. **Installing Node via `apt`.** You get an outdated version and no easy way to switch. Use NVM.
2. **Forgetting `pm2 save` after `pm2 startup`.** The app won't come back after a reboot — the boot hook has no saved list.
3. **Committing `.env`.** Secrets end up in git history forever. Keep it ignored and `chmod 600`.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `pm2: command not found` after reboot | PATH not in the startup script | Re-run the `sudo env PATH=...` line from `pm2 startup` |
| App `errored` / restart loop | Bad `.env` or missing build | `pm2 logs myapp --lines 100`; rebuild with `npm run build` |
| `npm ci` fails | Lockfile out of sync with `package.json` | Run `npm install` locally, commit the lockfile |
| App reachable on :3000 but not via domain | Nginx `proxy_pass`/`server_name` | See [Chapter 11](/chapters/11-nginx-reverse-proxy-ssl) troubleshooting |
| Memory grows until restart | Leak | `max_memory_restart` caps it; investigate with `pm2 monit` |

## Recap & next

Your NestJS app builds reproducibly, keeps secrets out of git, and runs under PM2 with crash recovery, a memory cap, and boot persistence — all behind Nginx.

Next: **[Chapter 14 — PostgreSQL & Database Management](/chapters/14-postgresql-database-management)** — back up and manage the data your app depends on.

## References

- [NVM](https://github.com/nvm-sh/nvm) — Node Version Manager.
- [Node.js](https://nodejs.org/en) — releases and LTS schedule.
- [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci) — reproducible installs.
- [NestJS documentation](https://docs.nestjs.com/) — framework reference.
- [NestJS configuration](https://docs.nestjs.com/techniques/configuration) — reading `.env` in the app.
- [PM2 quick start](https://pm2.keymetrics.io/docs/usage/quick-start/) — process management, `startup`, `save`.
