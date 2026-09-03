---
title: "Networking & Static IP"
order: 6
description: "Configure static IP using both router DHCP reservation and Netplan, understand DNS configuration, and set up local /etc/hosts for easy access."
---
## How Home Network IPs Work

Your router assigns IP addresses using **DHCP** (Dynamic Host Configuration Protocol). When a device connects, the router says "here's your IP: 192.168.1.105, valid for 24 hours". After 24 hours, the device might get a different IP.

This is a problem for a server — your SSH config has `HostName 192.168.1.105`, but tomorrow the server might be `192.168.1.107`. You need a **static IP** that never changes.

## Two Ways to Set Static IP (Use Both)

### Method 1: Router DHCP Reservation (Do This First)

Every home router has a "DHCP reservation" feature. You tell it: "When you see the MAC address `f8:94:c2:6a:5e:50` (your server's WiFi adapter), always assign it `192.168.1.100`."

1. Open your router admin page (usually `192.168.1.1` in browser)
2. Look for "DHCP" → "Static Leases" or "Address Reservation"
3. Add your server's MAC address → assign `192.168.1.100`

Find your server's MAC address:
```bash
ip link show wlp2s0   # your WiFi interface
# shows: link/ether f8:94:c2:6a:5e:50
```

### Method 2: Netplan Static IP (Server-Side Configuration)

Ubuntu uses **Netplan** to manage network interfaces. Config files live in `/etc/netplan/`.

```bash
# Find your config file
ls /etc/netplan/
# Usually: 00-installer-config.yaml

sudo nano /etc/netplan/00-installer-config.yaml
```

For WiFi (your case):
```yaml
network:
  version: 2
  wifis:
    wlp2s0:                          # your WiFi interface name
      dhcp4: no                      # disable automatic IP assignment
      addresses:
        - 192.168.1.100/24           # your desired static IP + subnet mask
      routes:
        - to: default
          via: 192.168.1.1           # your router's IP (gateway)
      nameservers:
        addresses:
          - 8.8.8.8                  # Google DNS
          - 1.1.1.1                  # Cloudflare DNS
          - 9.9.9.9                  # Quad9 DNS (privacy-focused)
      access-points:
        "YourWiFiName":              # your WiFi network name (SSID)
          password: "yourpassword"
```

What does `/24` mean? It's the **subnet mask** in CIDR notation. `/24` = `255.255.255.0`, meaning your network is `192.168.1.0` to `192.168.1.255`. All devices in your home share this range.

Test before applying (auto-reverts after 2 minutes if broken):
```bash
sudo netplan try
# If it works, type 'yes' to keep it
# If it breaks networking, just wait 2 minutes — it reverts automatically
```

Apply permanently:
```bash
sudo netplan apply
```

Verify:
```bash
ip addr show wlp2s0    # should show 192.168.1.100
ping 8.8.8.8           # test internet connectivity
ping google.com        # test DNS resolution
```

## Understanding DNS

When you type `google.com`, your computer asks a DNS (Domain Name System) server: "What IP address is google.com?" The DNS server responds with `142.250.185.46`. This is why we set `nameservers` in the Netplan config.

We use multiple DNS servers as fallback:
- `8.8.8.8` — Google's DNS (fast, reliable)
- `1.1.1.1` — Cloudflare's DNS (privacy-focused, fast)
- `9.9.9.9` — Quad9 (blocks malicious domains)

## Local DNS — Access Server by Name

Add this to `/etc/hosts` on your **MacBook** for easy access:
```
192.168.1.100    homelab homelab.local api.homelab.local
```

Now on your Mac you can access:
- `http://homelab.local` → your server's web UI
- `http://api.homelab.local` → your NestJS API
- `ssh homelab` → SSH shortcut