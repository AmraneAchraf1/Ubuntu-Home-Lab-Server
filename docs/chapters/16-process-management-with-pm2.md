---
title: "Process Management with PM2"
order: 16
description: "PM2 basics, cluster mode for multi-core, zero-downtime deployments with reload vs restart, and memory leak protection with max_memory_restart."
---
## Understanding Why PM2 is Essential

When you run `node dist/main.js` in a terminal and close the terminal, the process dies. PM2 decouples your process from the terminal session.

```bash
# Install PM2 globally
npm install -g pm2

# Basic usage
pm2 start dist/main.js --name "api"
pm2 list
pm2 logs api
pm2 stop api
pm2 restart api
pm2 delete api
```

## PM2 Cluster Mode for Multi-Core

Your i5 7th gen has 4 cores. Use them all:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/main.js',
    instances: 'max',     // use all available CPUs
    exec_mode: 'cluster', // Node.js cluster mode
    // PM2 load balances requests across instances
  }]
}
```

But be careful with cluster mode: if your app keeps state in memory (like a WebSocket map), cluster mode will break it because instances don't share memory. Use Redis for shared state.

## Zero-Downtime Deployment

```bash
# Instead of restart (which causes downtime):
pm2 restart api

# Use reload (graceful — waits for current requests to finish):
pm2 reload api