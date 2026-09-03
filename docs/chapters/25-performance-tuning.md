---
title: "Performance Tuning"
order: 25
description: "Kernel sysctl tuning (file descriptors, network buffers, TCP keepalive, swappiness, dirty ratios) and file descriptor limits in limits.conf."
---
## Kernel Parameters for a Server

```bash
sudo nano /etc/sysctl.d/99-server-tuning.conf
```

```ini
# Increase file descriptor limits (needed for many connections)
fs.file-max = 2097152

# Network performance
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535

# TCP keepalive (detect dead connections faster)
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10

# Swap behavior (0=avoid swap, 100=use swap aggressively)
# For a server with AI workloads, prefer RAM but allow swap
vm.swappiness = 10

# Improve I/O throughput for NVMe
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
```

Apply:
```bash
sudo sysctl -p /etc/sysctl.d/99-server-tuning.conf
```

## Increase File Descriptor Limits

```bash
sudo nano /etc/security/limits.conf
```
Add:
```
labadmin soft nofile 65536
labadmin hard nofile 65536
* soft nofile 65536
* hard nofile 65536