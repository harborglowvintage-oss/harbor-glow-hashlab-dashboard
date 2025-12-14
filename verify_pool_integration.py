#!/usr/bin/env python3
"""Detailed pool data verification."""

import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8100"

async def verify_pool_integration():
    """Verify pool data is matched correctly to local miners."""
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login
        print("\n" + "=" * 70)
        print("🔐 POOL DATA INTEGRATION TEST")
        print("=" * 70)
        
        login_response = await client.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "changeme123"},
            follow_redirects=True
        )
        
        if login_response.status_code != 200:
            print("❌ Login failed")
            return
        
        print("\n✅ Authenticated\n")
        
        # Fetch pool comparison data
        response = await client.get(f"{BASE_URL}/api/pool-comparison")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch pool comparison: HTTP {response.status_code}")
            return
        
        data = response.json()
        local_data = data.get("local", {})
        pool_data = data.get("pool", {})
        
        print("📊 MINER MATCHING ANALYSIS")
        print("-" * 70)
        
        total_local = 0
        total_pool = 0
        matched = 0
        
        for miner_key in sorted(local_data.keys()):
            local_info = local_data[miner_key]
            local_hr = local_info.get("hashrate_1m", 0)
            total_local += local_hr
            
            pool_info = pool_data.get(miner_key, {})
            pool_hr = pool_info.get("hashrate", 0)
            total_pool += pool_hr
            
            if pool_hr > 0:
                matched += 1
                status = "✅"
            else:
                status = "⚠️"
            
            pool_ths = pool_hr / 1e12 if pool_hr > 0 else 0
            local_ths = local_hr / 1e12 if local_hr > 0 else 0
            
            pool_name = pool_info.get("pool_name", "N/A")
            
            print(f"{status} Miner {miner_key:8} → Pool: {pool_name:15} | Local: {local_ths:6.2f} TH/s | Pool: {pool_ths:6.2f} TH/s")
        
        print("-" * 70)
        print(f"\n📈 TOTALS:")
        print(f"   Local Total: {total_local/1e12:.2f} TH/s")
        print(f"   Pool Total:  {total_pool/1e12:.2f} TH/s")
        print(f"   Matched: {matched} miners")
        
        if matched > 0:
            print(f"\n✅ Pool data successfully integrated!")
        else:
            print(f"\n❌ No pool data matched to local miners")
        
        print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(verify_pool_integration())
