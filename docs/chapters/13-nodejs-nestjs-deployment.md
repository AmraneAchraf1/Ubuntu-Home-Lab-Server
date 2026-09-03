---
title: "Node.js & NestJS Deployment"
order: 13
description: "Node.js with NVM, NestJS deployment with production .env, PM2 process management with ecosystem config, zero-downtime reloads, and auto-start on boot."
---
## Install Node.js with NVM

Never install Node.js directly via `apt` — the version is outdated. Use **NVM** (Node Version Manager):

```bash
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
```bash
nvm install 18
nvm use 18
node --version   # v18.x.x

nvm use 20
node --version   # v20.x.x
```

## Deploy NestJS Application

```bash
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

## Create a Production `.env` File

Never commit secrets to git. Create a `.env` file on the server:

```bash
nano /srv/apps/myapp/.env
```

```dotenv
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
```bash
chmod 600 /srv/apps/myapp/.env    # only owner can read/write
```

## Run with PM2

PM2 (Process Manager 2) keeps your Node.js apps running, restarts them on crashes, and starts them at boot.

```bash
# Start the app
pm2 start dist/main.js --name "myapp" --env production

# Or use an ecosystem file for more control:
nano /srv/apps/myapp/ecosystem.config.js
```

```javascript
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

```bash
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