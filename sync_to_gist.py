#!/usr/bin/env python3
"""
Local Miner Data Sync Script

This script runs on your local LAN (where it can reach the miners at 192.168.179.x)
and continuously polls miner data, then pushes it to a GitHub Gist so the cloud-deployed
dashboard can fetch it.

Environment Variables Required:
- GIST_TOKEN: GitHub personal access token with gist scope
- GIST_ID: The GitHub Gist ID to update (default: 9e0d60bcc84c808f505f9a4bfea0bc2f)

Usage:
    export GIST_TOKEN="your_github_token_here"
    export GIST_ID="9e0d60bcc84c808f505f9a4bfea0bc2f"
    python sync_to_gist.py
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import httpx

# Import the existing miner API functions
from miner_api import fetch_miner_stats

# Configuration
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", "60"))  # Poll every 60 seconds
GIST_TOKEN = os.getenv("GIST_TOKEN")
GIST_ID = os.getenv("GIST_ID", "9e0d60bcc84c808f505f9a4bfea0bc2f")
GIST_FILENAME = "miner_data.json"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("sync_to_gist")


def load_miners_config() -> Dict[str, str]:
    """Load miner configuration from miners_config.json"""
    config_file = Path("miners_config.json")
    if not config_file.exists():
        logger.error("miners_config.json not found!")
        return {}
    
    try:
        with open(config_file, 'r') as f:
            miners = json.load(f)
        logger.info(f"Loaded {len(miners)} miners from config")
        return miners
    except Exception as e:
        logger.error(f"Error loading miners_config.json: {e}")
        return {}


async def gather_miner_stats(miners: Dict[str, str]) -> Dict[str, Any]:
    """Poll all miners and gather their stats"""
    if not miners:
        return {}
    
    items = list(miners.items())
    tasks = [fetch_miner_stats(name, ip) for name, ip in items]
    results = await asyncio.gather(*tasks)
    
    stats = {}
    for (name, ip), payload in zip(items, results):
        miner_data = dict(payload)
        miner_data["ip"] = ip
        miner_data["dashboard_url"] = f"http://{ip}/"
        stats[name] = miner_data
    
    return stats


async def update_gist(data: Dict[str, Any]) -> bool:
    """Update the GitHub Gist with new miner data"""
    if not GIST_TOKEN:
        logger.error("GIST_TOKEN environment variable not set!")
        return False
    
    if not GIST_ID:
        logger.error("GIST_ID environment variable not set!")
        return False
    
    # Add metadata
    payload = {
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "sync_interval": SYNC_INTERVAL,
        "miner_count": len(data),
        "miners": data
    }
    
    # Prepare Gist update request
    gist_data = {
        "files": {
            GIST_FILENAME: {
                "content": json.dumps(payload, indent=2)
            }
        }
    }
    
    url = f"https://api.github.com/gists/{GIST_ID}"
    headers = {
        "Authorization": f"token {GIST_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.patch(url, headers=headers, json=gist_data)
            response.raise_for_status()
        
        logger.info(f"Successfully updated Gist {GIST_ID} with {len(data)} miner(s)")
        return True
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error updating Gist: {e.response.status_code} - {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"Error updating Gist: {e}")
        return False


async def sync_loop():
    """Main sync loop - continuously poll miners and update Gist"""
    logger.info("Starting miner data sync to GitHub Gist")
    logger.info(f"Sync interval: {SYNC_INTERVAL} seconds")
    logger.info(f"Gist ID: {GIST_ID}")
    
    # Load miner configuration
    miners = load_miners_config()
    if not miners:
        logger.error("No miners configured. Exiting.")
        return
    
    iteration = 0
    consecutive_failures = 0
    
    while True:
        try:
            iteration += 1
            logger.info(f"--- Sync iteration {iteration} ---")
            
            # Gather stats from all miners
            logger.info("Polling miners...")
            stats = await gather_miner_stats(miners)
            
            # Count online miners
            online_count = sum(1 for m in stats.values() if m.get("alive"))
            logger.info(f"Polled {len(stats)} miners, {online_count} online")
            
            # Update Gist
            logger.info("Updating Gist...")
            success = await update_gist(stats)
            
            if success:
                consecutive_failures = 0
                logger.info(f"Sync complete. Next sync in {SYNC_INTERVAL} seconds.")
            else:
                consecutive_failures += 1
                logger.warning(f"Sync failed ({consecutive_failures} consecutive failures)")
                
                if consecutive_failures >= 5:
                    logger.error("Too many consecutive failures. Check your GIST_TOKEN and GIST_ID.")
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal. Shutting down...")
            break
        except Exception as e:
            consecutive_failures += 1
            logger.exception(f"Unexpected error in sync loop: {e}")
        
        # Wait for next iteration
        await asyncio.sleep(SYNC_INTERVAL)


def main():
    """Entry point"""
    # Validate configuration
    if not GIST_TOKEN:
        logger.error("GIST_TOKEN environment variable is required!")
        logger.error("Set it with: export GIST_TOKEN='your_github_token_here'")
        sys.exit(1)
    
    if not GIST_ID:
        logger.error("GIST_ID environment variable is required!")
        logger.error("Set it with: export GIST_ID='9e0d60bcc84c808f505f9a4bfea0bc2f'")
        sys.exit(1)
    
    # Run the sync loop
    try:
        asyncio.run(sync_loop())
    except KeyboardInterrupt:
        logger.info("Shutdown complete.")


if __name__ == "__main__":
    main()
