#!/usr/bin/env python3
"""Verify all miners including the nerd are mapped correctly."""

import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8100"

async def verify_nerd_mapping():
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login
        print("\n" + "=" * 70)
        print("🔍 VERIFYING NERD MINER MAPPING")
        print("=" * 70 + "\n")
        
        login_response = await client.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "changeme123"},
            follow_redirects=True
        )
        
        if login_response.status_code != 200:
            print("❌ Login failed")
            return
        
        # Fetch pool comparison
        response = await client.get(f"{BASE_URL}/api/pool-comparison")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch pool comparison: HTTP {response.status_code}")
            return
        
        data = response.json()
        pool_miners = data.get('pool', {})
        local_miners = data.get('local', {})
        
        print(f"✅ Pool miners returned: {len(pool_miners)}")
        print(f"✅ Local miners returned: {len(local_miners)}\n")
        
        print("📊 MINER MAPPING VERIFICATION:")
        print("-" * 70)
        
        expected_miners = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H-nerd']
        for miner_key in expected_miners:
            if miner_key in pool_miners:
                pool_data = pool_miners[miner_key]
                hashrate_ths = pool_data.get('hashrate', 0) / 1e12
                pool_name = pool_data.get('pool_name', 'unknown')
                print(f"✅ {miner_key:8} → {pool_name:12} | {hashrate_ths:6.2f} TH/s")
            else:
                print(f"❌ {miner_key:8} → NOT FOUND")
        
        print("\n" + "=" * 70)
        print("Total pool hashrate:", sum(w.get('hashrate', 0) for w in pool_miners.values()) / 1e12, "TH/s")
        print("=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(verify_nerd_mapping())
