#!/usr/bin/env python3
"""Comprehensive graph data verification."""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:8100"

async def verify_all_graphs():
    """Verify all graph endpoints are working with real data."""
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login
        print("\n" + "=" * 70)
        print("🔐 GRAPH DATA VERIFICATION REPORT")
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
        
        # Test all graph endpoints
        tests = [
            {
                "endpoint": "/miner-data",
                "name": "Miner Data",
                "checks": ["A", "B", "C", "D", "E"]  # Miner IDs
            },
            {
                "endpoint": "/api/pool-comparison",
                "name": "Pool Comparison",
                "checks": ["local", "pool"]  # Data sections
            },
            {
                "endpoint": "/historical-metrics",
                "name": "Historical Metrics",
                "checks": ["success", "data", "summary"]
            },
            {
                "endpoint": "/tuning/recommendations",
                "name": "Tuning Recommendations",
                "checks": ["success", "data"]
            },
        ]
        
        all_pass = True
        
        for test in tests:
            print(f"\n📊 {test['name']}")
            print("-" * 70)
            
            response = await client.get(f"{BASE_URL}{test['endpoint']}")
            
            if response.status_code != 200:
                print(f"❌ HTTP {response.status_code}")
                all_pass = False
                continue
            
            try:
                data = response.json()
                print(f"✅ HTTP 200 | Response is valid JSON")
                
                # Check for required fields
                missing = []
                for check in test['checks']:
                    if check not in data:
                        missing.append(check)
                
                if missing:
                    print(f"⚠️  Missing fields: {missing}")
                else:
                    print(f"✅ All required fields present: {test['checks']}")
                
                # Show data details
                if test['endpoint'] == "/miner-data":
                    miner_count = len([k for k in data.keys() if k in 'ABCDEFGHIJ'])
                    print(f"✅ Miner count: {miner_count}")
                    if miner_count > 0:
                        first_miner = list(data.values())[0]
                        if isinstance(first_miner, dict):
                            print(f"   Sample fields: {list(first_miner.keys())[:3]}")
                
                elif test['endpoint'] == "/api/pool-comparison":
                    if data['local']:
                        print(f"✅ Local miner data: {len(data['local'])} miners")
                    else:
                        print(f"⚠️  Local miner data is empty")
                    
                    if data['pool']:
                        print(f"✅ Pool data: {len(data['pool'])} workers")
                    else:
                        print(f"❌ Pool data is empty")
                        all_pass = False
                
                elif test['endpoint'] == "/historical-metrics":
                    if data['success']:
                        print(f"✅ Data collection successful")
                        print(f"✅ Historical data points: {len(data['data'])}")
                    else:
                        print(f"❌ Data collection failed")
                        all_pass = False
                
                elif test['endpoint'] == "/tuning/recommendations":
                    if data['success']:
                        print(f"✅ Recommendations generated")
                        print(f"✅ Count: {data.get('count', 0)} recommendations")
                        print(f"   Source: {data.get('source', 'unknown')}")
                    else:
                        print(f"⚠️  Recommendations not available")
                
            except json.JSONDecodeError:
                print(f"❌ Response is not valid JSON")
                all_pass = False
            except Exception as e:
                print(f"❌ Error processing response: {e}")
                all_pass = False
        
        # Summary
        print("\n" + "=" * 70)
        if all_pass:
            print("✅ ALL GRAPHS VERIFIED SUCCESSFULLY")
        else:
            print("⚠️  Some issues detected - see details above")
        print("=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(verify_all_graphs())
