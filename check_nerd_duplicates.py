#!/usr/bin/env python3
"""Check for duplicate nerd entries."""

import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8100"

async def check_duplicates():
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login
        login_response = await client.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "changeme123"},
            follow_redirects=True
        )
        
        # Fetch pool comparison
        response = await client.get(f"{BASE_URL}/api/pool-comparison")
        
        if response.status_code != 200:
            print(f"Failed: HTTP {response.status_code}")
            return
        
        data = response.json()
        pool_miners = data.get('pool', {})
        
        print("\n📋 POOL MINERS KEYS:")
        for key in sorted(pool_miners.keys()):
            print(f"  {key}")
        
        print(f"\nTotal entries: {len(pool_miners)}")
        
        # Check for nerd duplicates
        nerd_entries = [k for k in pool_miners.keys() if 'nerd' in k.lower()]
        print(f"\nNerd entries found: {nerd_entries}")
        
        if len(nerd_entries) > 1:
            print("\n⚠️  DUPLICATE NERD ENTRIES DETECTED!")
            for entry in nerd_entries:
                print(f"  {entry}: {pool_miners[entry]}")

asyncio.run(check_duplicates())
