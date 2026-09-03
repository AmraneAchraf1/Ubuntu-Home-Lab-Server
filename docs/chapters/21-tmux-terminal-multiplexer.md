---
title: "Tmux — Terminal Multiplexer"
order: 21
description: "Why tmux for persistent sessions, complete cheatsheet (sessions, windows, panes, scrolling), and custom config with mouse support and Ctrl+A prefix."
---
## Why Tmux?

When your SSH connection drops, every terminal process you had running dies. If you were running a 6-hour data cleaning job, it's gone.

Tmux runs a persistent terminal server on your server. Your sessions survive disconnects. You can detach and reattach from any device.

```bash
sudo apt install -y tmux

# Create a new session
tmux new -s main

# Detach (session keeps running)
Ctrl+B, D

# List sessions
tmux ls

# Reattach
tmux attach -t main
# or just
tmux a     # attach to most recent
```

## Tmux Cheatsheet

All tmux commands start with the **prefix**: `Ctrl+B`

```
# Sessions
Ctrl+B, D           Detach from session
Ctrl+B, $           Rename session
Ctrl+B, (           Switch to previous session
Ctrl+B, )           Switch to next session
Ctrl+B, s           List all sessions (interactive)

# Windows (like browser tabs)
Ctrl+B, c           Create new window
Ctrl+B, ,           Rename current window
Ctrl+B, n           Next window
Ctrl+B, p           Previous window
Ctrl+B, 0-9         Switch to window by number
Ctrl+B, w           List all windows

# Panes (split screen)
Ctrl+B, %           Split vertically (side by side)
Ctrl+B, "           Split horizontally (top/bottom)
Ctrl+B, Arrow       Move to pane
Ctrl+B, z           Zoom/unzoom current pane (fullscreen)
Ctrl+B, x           Close current pane
Ctrl+B, {           Move pane left
Ctrl+B, }           Move pane right

# Scrolling
Ctrl+B, [           Enter copy/scroll mode
Arrow keys / PgUp   Scroll
q                   Exit scroll mode
```

## Custom Tmux Config

```bash
nano ~/.tmux.conf
```

```bash
# Change prefix to Ctrl+A (easier to reach)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Enable mouse support (click to switch panes, scroll)
set -g mouse on

# Start windows and panes at 1, not 0
set -g base-index 1
setw -g pane-base-index 1

# Status bar
set -g status-style bg=colour234,fg=colour255
set -g status-left '#[fg=colour82][#S] '
set -g status-right '#[fg=colour82]%H:%M #[fg=colour255]%Y-%m-%d'

# Increase history
set -g history-limit 50000
```

Apply: `tmux source ~/.tmux.conf`