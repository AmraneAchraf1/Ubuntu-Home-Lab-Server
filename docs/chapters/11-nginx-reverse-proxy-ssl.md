---
title: "Nginx — Reverse Proxy & SSL"
order: 11
description: "Reverse proxy configuration for multiple services, virtual hosts, SSL termination with mkcert for local HTTPS, security headers, and WebSocket support."
---
## What is a Reverse Proxy and Why?

Imagine you have:
- NestJS API on port 3000
- React frontend on port 3001
- pgAdmin on port 5050
- Another service on port 8080

Without Nginx, users need to type `http://192.168.1.100:3000` for the API, `:3001` for frontend, etc.

With Nginx as a reverse proxy:
- `http://api.homelab.local` → forwards to port 3000
- `http://app.homelab.local` → forwards to port 3001
- `http://db.homelab.local` → forwards to port 5050

Nginx sits in front of all services and routes requests based on domain name. Users only ever talk to Nginx (port 80/443). It's like a receptionist who directs visitors to the right department.

Additional benefits:
- **SSL termination** — Nginx handles HTTPS, your apps run plain HTTP internally
- **Load balancing** — Distribute traffic across multiple app instances
- **Caching** — Cache static files at Nginx level
- **Rate limiting** — Protect against DDoS
- **Compression** — Gzip responses to reduce bandwidth

## Install and Configure Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo ufw allow 'Nginx Full'
```

## Configure Virtual Hosts

Each service gets its own config file in `/etc/nginx/sites-available/`:

```bash
sudo nano /etc/nginx/sites-available/nestjs-api
```

```nginx
server {
    listen 80;
    server_name api.homelab.local;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Required for WebSocket support (NestJS often uses this)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Pass real client info to NestJS
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve large file uploads (for your data pipeline)
    client_max_body_size 500M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nestjs-api /etc/nginx/sites-enabled/
sudo nginx -t          # Test config syntax (always do this!)
sudo systemctl reload nginx
```

## Local HTTPS with mkcert

For local development with HTTPS (some browser APIs require it):

```bash
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Create and install local CA
mkcert -install

# Create certificate for your local domains
mkcert homelab.local "*.homelab.local" localhost 127.0.0.1 192.168.1.100
```

Update nginx config to use HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name api.homelab.local;

    ssl_certificate /home/labadmin/homelab.local+3.pem;
    ssl_certificate_key /home/labadmin/homelab.local+3-key.pem;

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.homelab.local;
    return 301 https://$server_name$request_uri;
}