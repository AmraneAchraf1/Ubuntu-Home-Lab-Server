---
title: "Docker — Containers Explained"
order: 10
description: "Docker concepts (images, containers, volumes, networks), installation with official repo, daemon configuration with log limits, and complete dev stack with docker-compose."
---
## What is Docker and Why Use It?

Without Docker, installing a Node.js app with Postgres on a server means:
1. Install Node.js (conflicts with system Node?)
2. Install Postgres (configure it, set passwords, create users)
3. Handle environment differences (dev vs prod)
4. App works on your Mac but not the server due to different OS versions

With Docker:
- Each service runs in its own **container** — isolated, with its own dependencies
- A container is like a lightweight VM but shares the kernel
- "It works on my machine" becomes "it works in the container, everywhere"
- Start your entire stack with one command: `docker compose up`

## Core Docker Concepts

**Image** — A read-only template. `postgres:15` is an image. Like a class in OOP.

**Container** — A running instance of an image. Like an object instantiated from a class. Containers are ephemeral — destroying one doesn't affect the image.

**Volume** — Persistent storage attached to a container. When a container is deleted, data in volumes survives.

**Network** — Docker creates virtual networks so containers can communicate. By default, containers in the same `docker-compose.yml` can reach each other by service name.

## Install Docker

```bash
# Remove old/conflicting packages
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key (verify packages are authentic)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Run without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker run hello-world
docker --version
docker compose version
```

## Configure Docker Storage Location

By default, Docker stores everything in `/var/lib/docker`. Since we gave `/var` its own 50GB partition, this is good — Docker data won't overflow into your root partition.

Configure Docker daemon with best practices:
```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

::: info
**Why log limits?** Without limits, Docker container logs can grow indefinitely and fill your disk. `max-size: 10m` means each log file is max 10MB, and `max-file: 3` means only 3 rotated files are kept. Max 30MB per container.
:::

```bash
sudo systemctl restart docker
```

## Your Development Stack with Docker Compose

Create the directory structure:
```bash
mkdir -p ~/docker/stack
nano ~/docker/stack/docker-compose.yml
```

```yaml
version: '3.9'

services:
  # ─── PostgreSQL Database ────────────────────────────────────
  postgres:
    image: postgres:15-alpine          # alpine = smaller image
    container_name: postgres
    restart: unless-stopped            # restart on crash, not on manual stop
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    ports:
      - "127.0.0.1:5432:5432"          # bind to localhost only (safer)
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # run SQL on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d devdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Redis Cache ─────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --requirepass redispass --appendonly yes
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data

  # ─── pgAdmin — Database GUI ──────────────────────────────────
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@homelab.local
      PGADMIN_DEFAULT_PASSWORD: adminpass
      PGADMIN_CONFIG_SERVER_MODE: 'False'   # single-user mode
    ports:
      - "5050:80"
    volumes:
      - pgadmindata:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy        # wait for postgres to be ready

  # ─── Adminer — Lightweight DB GUI ────────────────────────────
  adminer:
    image: adminer:latest
    container_name: adminer
    restart: unless-stopped
    ports:
      - "8080:8080"

volumes:
  pgdata:
  redisdata:
  pgadmindata:
```

```bash
cd ~/docker/stack

# Start everything
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f postgres

# Stop everything
docker compose down

# Stop and DELETE volumes (destroys data!)
docker compose down -v
```

## Useful Docker Commands

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Enter a running container (like SSH into it)
docker exec -it postgres bash
docker exec -it postgres psql -U devuser devdb

# View container logs
docker logs postgres
docker logs -f postgres    # follow mode (like tail -f)
docker logs --tail 50 postgres   # last 50 lines

# Copy file from container to host
docker cp postgres:/etc/postgresql/postgresql.conf ./

# Check container resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Full cleanup (careful! removes everything unused)
docker system prune -a