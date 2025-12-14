#!/usr/bin/env python3
"""Check local miner data."""

import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8100"

async def check_local_data():
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login
        login_response = await client.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "changeme123"},
            follow_redirects=True
        )
        
        # Fetch miner data
        response = await client.get(f"{BASE_URL}/miner-data")
        
        if response.status_code == 200:
            data = response.json()
            print("Local miner data structure:")
            for miner, info in list(data.items())[:3]:
                print(f"\n{miner}:")
                for key, val in info.items():
                    print(f"  {key}: {val}")
        else:
            print(f"Failed: HTTP {response.status_code}")

asyncio.run(check_local_data())
