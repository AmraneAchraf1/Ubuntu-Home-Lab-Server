---
title: "Environment Variables & Secrets Management"
order: 23
description: "Why never hardcode secrets, .env file security with 600 permissions, .gitignore patterns, a .env.example template, and generating strong secrets with openssl."
difficulty: Beginner
estimatedTime: 20 min
prerequisites:
  - "A deployed app (Chapter 13)"
  - "The app's directory under /srv/apps"
---

<ChapterMeta />

## TL;DR

- **Secrets belong in the environment, not the code.** Read them via `process.env`.
- **Lock down `.env` with `chmod 600`** and correct ownership.
- **Ignore `.env` in git; commit only `.env.example`** with placeholders.
- **Generate real secrets with `openssl rand`** — never "change-this-later".
- A leaked secret must be **rotated**, not just deleted from git.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| A deployed app | Where the `.env` lives. |
| Its repo | To add `.gitignore` rules. |

## Never hardcode secrets

```js [bad-good.js]
# Bad - secret in code (NEVER DO THIS)
const db = new Pool({ password: "mypassword" })

# Good - read from environment
const db = new Pool({ password: process.env.DB_PASSWORD })
```

```mermaid
flowchart LR
  ENV[.env file · chmod 600] --> APP[App: process.env]
  APP --> DB[(Postgres)]
  APP --> RED[(Redis)]
  GIT[git repository] -.must NOT contain.-> ENV
  EX[.env.example] --> GIT
```

<p class="ahl-diagram-caption"><strong>Figure 23.1</strong> — Secrets flow from a locked-down `.env` into the process; only placeholders reach git.</p>

::: details Why this matters — 12-factor config
The [Twelve-Factor App](https://12factor.net/config) rule is simple: store config in the *environment*, strictly separate from code. That's what lets the same build run in dev and prod with different credentials, and what keeps secrets out of version control and image layers.
:::

## Step 1 — `.env` files and security

**Run** the block. **Expected:** `.env` is `-rw-------` and owned by your user.

```bash [secure-env.sh]
# Create .env with strict permissions
nano /srv/apps/myapp/.env
chmod 600 /srv/apps/myapp/.env   # only owner can read
chown ahmed:ahmed /srv/apps/myapp/.env
```

## Step 2 — Keep `.env` out of git

**Run** the block. **Expected:** `git check-ignore .env` prints `.env`.

```bash [gitignore.sh]
echo ".env" >> /srv/apps/myapp/.gitignore
echo ".env.*" >> /srv/apps/myapp/.gitignore
echo "!.env.example" >> /srv/apps/myapp/.gitignore
```

Create a `.env.example` with placeholder values:

```dotenv [.env.example]
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=generate-a-random-secret-here
```

<figure>
  <svg viewBox="0 0 720 200" role="img" aria-label="Which files are tracked by git: the real .env is ignored, while .env.example is committed" width="100%" style="max-width:720px;height:auto;border-radius:10px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);padding:1rem;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;">
    <rect x="16" y="40" width="330" height="120" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-red-1, #dc2626)"></rect>
    <text x="181" y="66" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--vp-c-red-1, #dc2626)">Ignored by git</text>
    <text x="36" y="96" font-size="12" fill="var(--vp-c-text-2)" font-family="'JetBrains Mono',monospace">.env</text>
    <text x="36" y="120" font-size="11" fill="var(--vp-c-text-3)">real secrets · chmod 600</text>
    <text x="36" y="144" font-size="11" fill="var(--vp-c-text-3)">never leaves the server</text>
    <rect x="374" y="40" width="330" height="120" rx="10" fill="var(--vp-c-bg)" stroke="var(--vp-c-brand-1)"></rect>
    <text x="539" y="66" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--vp-c-brand-1)">Committed</text>
    <text x="394" y="96" font-size="12" fill="var(--vp-c-text-2)" font-family="'JetBrains Mono',monospace">.env.example</text>
    <text x="394" y="120" font-size="11" fill="var(--vp-c-text-3)">placeholders only</text>
    <text x="394" y="144" font-size="11" fill="var(--vp-c-text-3)">documents required vars</text>
  </svg>
  <figcaption><strong>Figure 23.2</strong> — The split: real values stay on the server; the repo carries only the template.</figcaption>
</figure>

## Step 3 — Generate strong secrets

**Run** the commands. **Expected:** high-entropy output for each.

```bash [gen-secrets.sh]
# Generate a 64-char random string (perfect for JWT secrets)
openssl rand -base64 48

# Generate a UUID
python3 -c "import uuid; print(uuid.uuid4())"

# Generate a random hex string
openssl rand -hex 32
```

| Command | Output | Use for |
|---------|--------|---------|
| `openssl rand -base64 48` | 64-char base64 | JWT/session secrets |
| `openssl rand -hex 32` | 64-char hex | API keys, salts |
| `python3 -c "import uuid"` | UUID | identifiers |

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Permissions tight | `ls -l /srv/apps/myapp/.env` | `-rw-------` |
| Ignored by git | `git check-ignore .env` | `.env` |
| Only template tracked | `git ls-files \| grep env` | `.env.example` only |
| No secrets in history | `git log -p -- .env` | no output |
| App reads env | app starts without errors | env loaded |

```bash [verify.sh]
ls -l /srv/apps/myapp/.env
cd /srv/apps/myapp && git check-ignore .env && git ls-files | grep -i env
```

## Common pitfalls

::: warning Top 3 failure modes
1. **Committing `.env`.** Even one commit leaks it forever in history. Ignore it *before* the first push.
2. **World-readable `.env`.** Default `644` exposes secrets to every user. `chmod 600`.
3. **Weak/placeholder secrets.** "change-this-later" ships to prod. Generate real secrets and rotate on exposure.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Secret already committed | `.env` tracked before ignore | `git rm --cached .env`, rotate the secret |
| App can't read env | Permissions/owner | `chown ahmed:ahmed`, `chmod 600` |
| `.env.example` also ignored | Blanket `.env*` pattern | Add `!.env.example` after the ignore |
| Env not loaded by app | Missing dotenv/config module | Ensure the app loads `.env` (NestJS `ConfigModule`) |
| Secret in logs | Logging the env | Never log secrets; redact in error handlers |

## Recap & next

You can store, protect, generate, and git-ignore secrets correctly — and you know that an exposed secret must be rotated, not just removed.

Next: **[Chapter 24 — Log Management](/chapters/24-log-management)** — keep logs useful without filling the disk.

## References

- [The Twelve-Factor App — Config](https://12factor.net/config) — the principle behind `.env`.
- [dotenv](https://github.com/motdotla/dotenv) — loading `.env` in Node.
- [`man openssl`](https://manpages.ubuntu.com/manpages/noble/en/man1/openssl.1.html) — the toolkit.
- [`man openssl-rand`](https://manpages.ubuntu.com/manpages/noble/en/man1/openssl-rand.1.html) — generating random secrets.
- [gitignore documentation](https://git-scm.com/docs/gitignore) — ignore patterns and negation.
