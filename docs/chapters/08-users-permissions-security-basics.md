---
title: "Users, Permissions & Security Basics"
order: 8
description: "User management (adduser, usermod, groups), principle of least privilege, service users, and secure file sharing with group permissions."
---
## User Management

```bash
# Add a new user (useful if you want a deploy user)
sudo adduser deployuser

# Add user to sudo group (admin privileges)
sudo usermod -aG sudo deployuser

# Add user to docker group (can run docker without sudo)
sudo usermod -aG docker labadmin

# Apply group changes without logout
newgrp docker

# See all users
cat /etc/passwd | grep -v nologin

# See groups a user belongs to
groups labadmin

# Switch to another user
su - deployuser

# Delete a user
sudo deluser deployuser
sudo deluser --remove-home deployuser  # also remove home directory
```

## Understanding Groups

Groups allow multiple users to share access to files. For example:
- `docker` group — can run Docker commands
- `sudo` group — can use sudo
- `www-data` group — Nginx runs as this user

```bash
# Create a group
sudo groupadd developers

# Add user to group
sudo usermod -aG developers labadmin

# Set a directory to be accessible by a group
sudo chgrp -R developers /srv/apps
sudo chmod -R g+rwx /srv/apps
```

## The Principle of Least Privilege

Every process and user should have only the minimum permissions needed. This limits damage if something goes wrong.

Examples:
- Nginx runs as `www-data` user (not root) — if hacked, attacker can't access root files
- Your NestJS app doesn't need root — run it as a regular user
- Docker containers run as non-root users (configure this in Dockerfiles)

```bash
# Run a process as a specific user
sudo -u www-data nginx

# Create a service user with no login shell (for running services)
sudo useradd --system --no-create-home --shell /usr/sbin/nologin nestapp