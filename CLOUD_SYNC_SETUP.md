# Cloud Sync Setup Guide

This guide explains how to set up the local-to-cloud data sync system for the Harbor Glow HashLab Dashboard.

## Problem

When the dashboard is deployed to a cloud platform like Render, it cannot directly reach miners on your local LAN (e.g., `192.168.179.x` addresses). The cloud servers have no route to these private IP addresses.

## Solution

We implement a **two-part sync system** using GitHub Gist as an intermediary:

1. **Local Sync Script** (`sync_to_gist.py`) - Runs on your LAN, polls miners, and pushes data to a GitHub Gist
2. **Cloud Dashboard** - Reads miner data from the Gist instead of polling miners directly

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Local LAN      │         │ GitHub Gist  │         │  Render Cloud   │
│                 │         │              │         │                 │
│  Miners ────▶   │  Push   │              │  Fetch  │   Dashboard     │
│  192.168.x.x    │ ──────▶ │  JSON Data   │ ◀────── │   (main.py)     │
│                 │         │              │         │                 │
│  sync_to_gist.py│         │              │         │ CLOUD_MODE=true │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Prerequisites

1. A GitHub account
2. Python 3.8+ installed on your local machine (where miners are accessible)
3. This repository cloned locally
4. Miners configured in `miners_config.json`

## Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Direct link: https://github.com/settings/tokens/new
2. Create a new token with the **`gist`** scope enabled
3. Copy the token - you'll need it in the next step
4. **Keep it secure!** This token allows writing to your Gists

## Step 2: Create or Use an Existing Gist

### Option A: Use the Default Gist (Recommended)

The system is pre-configured to use Gist ID: `9e0d60bcc84c808f505f9a4bfea0bc2f`

You can create this Gist at: https://gist.github.com/

1. Click "Create a new gist"
2. Filename: `miner_data.json`
3. Content: `{}`
4. Create as **Public** or **Secret** (your choice)
5. Copy the Gist ID from the URL (the long alphanumeric string)

### Option B: Use a Custom Gist

If you want to use a different Gist:

1. Create a new Gist as described above
2. Note the Gist ID from the URL
3. Set the `GIST_ID` environment variable when running the sync script

## Step 3: Configure the Local Sync Script

1. Copy the example environment file:
   ```bash
   cp .env.sync.example .env.sync
   ```

2. Edit `.env.sync` and set your values:
   ```bash
   # Your GitHub Personal Access Token
   GIST_TOKEN=ghp_your_token_here
   
   # Gist ID (use default or your custom one)
   GIST_ID=9e0d60bcc84c808f505f9a4bfea0bc2f
   
   # Sync interval in seconds (default: 60)
   SYNC_INTERVAL=60
   ```

3. Load the environment variables:
   ```bash
   export $(cat .env.sync | xargs)
   ```
   
   Or set them individually:
   ```bash
   export GIST_TOKEN="ghp_your_token_here"
   export GIST_ID="9e0d60bcc84c808f505f9a4bfea0bc2f"
   export SYNC_INTERVAL="60"
   ```

## Step 4: Run the Sync Script

### Test Run (Foreground)

First, test that everything works:

```bash
python sync_to_gist.py
```

You should see output like:
```
2025-12-13 10:30:00 - sync_to_gist - INFO - Starting miner data sync to GitHub Gist
2025-12-13 10:30:00 - sync_to_gist - INFO - Sync interval: 60 seconds
2025-12-13 10:30:00 - sync_to_gist - INFO - Gist ID: 9e0d60bcc84c808f505f9a4bfea0bc2f
2025-12-13 10:30:00 - sync_to_gist - INFO - Loaded 8 miners from config
2025-12-13 10:30:00 - sync_to_gist - INFO - --- Sync iteration 1 ---
2025-12-13 10:30:00 - sync_to_gist - INFO - Polling miners...
2025-12-13 10:30:03 - sync_to_gist - INFO - Polled 8 miners, 7 online
2025-12-13 10:30:03 - sync_to_gist - INFO - Updating Gist...
2025-12-13 10:30:04 - sync_to_gist - INFO - Successfully updated Gist 9e0d60bcc84c808f505f9a4bfea0bc2f with 8 miner(s)
2025-12-13 10:30:04 - sync_to_gist - INFO - Sync complete. Next sync in 60 seconds.
```

Press `Ctrl+C` to stop.

### Production Run (Background Service)

#### Option A: Using `nohup` (Simple)

Run the script in the background:

```bash
nohup python sync_to_gist.py > sync.log 2>&1 &
```

Check logs:
```bash
tail -f sync.log
```

Stop it:
```bash
pkill -f sync_to_gist.py
```

#### Option B: Using `screen` (Recommended for SSH sessions)

Start a screen session:
```bash
screen -S miner-sync
```

Run the sync script:
```bash
export $(cat .env.sync | xargs)
python sync_to_gist.py
```

Detach from screen: Press `Ctrl+A` then `D`

Reattach later:
```bash
screen -r miner-sync
```

#### Option C: Using `systemd` (Best for Linux servers)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/miner-sync.service
```

Add this content (adjust paths to match your setup):

```ini
[Unit]
Description=Harbor Glow Miner Data Sync to GitHub Gist
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/harbor-glow-hashlab-dashboard
Environment="GIST_TOKEN=ghp_your_token_here"
Environment="GIST_ID=9e0d60bcc84c808f505f9a4bfea0bc2f"
Environment="SYNC_INTERVAL=60"
ExecStart=/usr/bin/python3 /path/to/harbor-glow-hashlab-dashboard/sync_to_gist.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable miner-sync.service
sudo systemctl start miner-sync.service
```

Check status:
```bash
sudo systemctl status miner-sync.service
```

View logs:
```bash
sudo journalctl -u miner-sync.service -f
```

## Step 5: Verify the Gist is Updating

1. Navigate to your Gist URL:
   ```
   https://gist.github.com/YOUR_USERNAME/9e0d60bcc84c808f505f9a4bfea0bc2f
   ```

2. You should see `miner_data.json` with content like:
   ```json
   {
     "last_updated": "2025-12-13T10:30:04.123456Z",
     "sync_interval": 60,
     "miner_count": 8,
     "miners": {
       "A": {
         "name": "A",
         "type": "BG02",
         "hashrate_1m": 8.5,
         "temp": 45.2,
         "alive": true,
         ...
       },
       ...
     }
   }
   ```

3. The `last_updated` timestamp should update every 60 seconds (or your configured interval)

## Step 6: Configure Cloud Dashboard (Render)

The cloud dashboard is already configured via `render.yaml`:

```yaml
envVars:
  - key: CLOUD_MODE
    value: true
```

When `CLOUD_MODE=true`, the dashboard will:
- Fetch miner data from the Gist instead of polling directly
- Cache the data for 30 seconds to avoid rate limits
- Gracefully fall back to cached data if the Gist is temporarily unavailable

## Troubleshooting

### Sync script fails with "GIST_TOKEN environment variable not set"

Make sure you've exported the environment variables:
```bash
export GIST_TOKEN="your_token_here"
```

Or load from `.env.sync`:
```bash
export $(cat .env.sync | xargs)
```

### Sync script fails with "HTTP error 404"

- Check that your Gist ID is correct
- Make sure the Gist exists and you're the owner
- Verify your token has the `gist` scope

### Sync script fails with "HTTP error 401"

- Your GitHub token is invalid or expired
- Generate a new token and update `GIST_TOKEN`

### Cloud dashboard shows "No miners" or old data

- Check that the sync script is running on your local machine
- Verify the Gist is being updated (check the timestamp)
- Check the cloud dashboard logs for errors fetching from Gist
- Ensure `CLOUD_MODE=true` is set in your Render environment variables

### High GitHub API rate limits

- Increase `SYNC_INTERVAL` to reduce update frequency (e.g., 120 seconds)
- Increase `GIST_CACHE_TTL` in cloud dashboard to cache longer

## Advanced Configuration

### Custom Gist URL

If you want to use a different Gist or GitHub Enterprise:

```bash
export GIST_RAW_URL="https://gist.githubusercontent.com/your-user/your-gist-id/raw/miner_data.json"
```

Add to `render.yaml`:
```yaml
- key: GIST_RAW_URL
  value: https://gist.githubusercontent.com/your-user/your-gist-id/raw/miner_data.json
```

### Adjust Cache TTL

Control how long the cloud dashboard caches Gist data:

```yaml
- key: GIST_CACHE_TTL
  value: 60  # Cache for 60 seconds
```

Lower values = more frequent Gist fetches, more up-to-date data, higher API usage
Higher values = less API usage, slightly staler data

## Security Considerations

1. **Keep your GIST_TOKEN secret** - It allows writing to your Gists
2. **Use a Secret Gist** if you don't want miner data to be publicly visible
3. **Rotate tokens periodically** for better security
4. **Don't commit `.env.sync`** to version control (it's already in `.gitignore`)
5. **Consider IP address exposure** - The sync script includes miner IPs in the Gist. If using a public Gist, these will be visible. Use a Secret Gist if this is a concern.

## Monitoring

### Local Sync Script

Check that it's running and healthy:
```bash
# If using systemd
sudo systemctl status miner-sync.service

# If using screen
screen -r miner-sync

# If using nohup
tail -f sync.log
```

### Cloud Dashboard

Check Render logs to see:
- Confirmation that `CLOUD_MODE` is enabled
- Successful Gist fetches
- Any errors or warnings

## Support

If you encounter issues:

1. Check the sync script logs for errors
2. Verify your Gist is updating by viewing it directly
3. Check cloud dashboard logs in Render
4. Open an issue on GitHub with relevant logs

## Summary

Once set up, the flow is:

1. **Local**: `sync_to_gist.py` runs continuously, polling miners every 60s and pushing to Gist
2. **Cloud**: Dashboard on Render fetches from Gist every 30s and displays the data
3. **Users**: Access the dashboard via Render URL, seeing near-real-time miner data

This architecture allows a cloud-hosted dashboard to display data from miners on a private LAN without exposing them to the internet.
