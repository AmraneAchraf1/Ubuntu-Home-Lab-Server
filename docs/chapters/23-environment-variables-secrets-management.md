---
title: "Environment Variables & Secrets Management"
order: 23
description: "Why never hardcode secrets, .env file security with 600 permissions, .gitignore patterns, .env.example template, and generating strong secrets with openssl."
---
## Never Hardcode Secrets

```bash
# Bad - secret in code (NEVER DO THIS)
const db = new Pool({ password: "mypassword" })

# Good - read from environment
const db = new Pool({ password: process.env.DB_PASSWORD })
```

## .env Files and Security

```bash
# Create .env with strict permissions
nano /srv/apps/myapp/.env
chmod 600 /srv/apps/myapp/.env   # only owner can read
chown labadmin:labadmin /srv/apps/myapp/.env
```

Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> /srv/apps/myapp/.gitignore
echo ".env.*" >> /srv/apps/myapp/.gitignore
echo "!.env.example" >> /srv/apps/myapp/.gitignore
```

Create a `.env.example` with placeholder values:
```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=generate-a-random-secret-here
```

## Generate Strong Secrets

```bash
# Generate a 64-char random string (perfect for JWT secrets)
openssl rand -base64 48

# Generate a UUID
python3 -c "import uuid; print(uuid.uuid4())"

# Generate a random hex string
openssl rand -hex 32