---
title: "Git Workflow on the Server"
order: 22
description: "Dedicated SSH key for GitHub, bare repository setup, post-receive hook for automatic deployment on git push, and remote configuration."
---
## SSH Key for GitHub

Generate a dedicated key for your server:

```bash
ssh-keygen -t ed25519 -C "homelab-server-$(date +%Y)" -f ~/.ssh/github_homelab
```

Add to `~/.ssh/config`:
```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_homelab
```

Add the public key to GitHub:
```bash
cat ~/.ssh/github_homelab.pub
# Copy output → GitHub.com → Settings → SSH Keys → New SSH Key
```

Test:
```bash
ssh -T git@github.com
# Hi username! You've successfully authenticated
```

## Deployment with Git Hooks

Git hooks run scripts automatically on git events. Use `post-receive` for auto-deploy:

```bash
# On server — create a bare repository
mkdir -p /srv/git/myapp.git
cd /srv/git/myapp.git
git init --bare

# Create post-receive hook
nano hooks/post-receive
```

```bash
#!/bin/bash
GIT_WORK_TREE=/srv/apps/myapp
GIT_DIR=/srv/git/myapp.git

echo "Deploying to $GIT_WORK_TREE..."
git --work-tree="$GIT_WORK_TREE" --git-dir="$GIT_DIR" checkout -f main

cd $GIT_WORK_TREE
npm ci --only=production
npm run build
pm2 reload myapp

echo "Deploy complete!"
```

```bash
chmod +x hooks/post-receive
```

On your **Mac**, add the server as a git remote:
```bash
git remote add homelab labadmin@homelab:/srv/git/myapp.git
git push homelab main
# This triggers the hook and deploys automatically!