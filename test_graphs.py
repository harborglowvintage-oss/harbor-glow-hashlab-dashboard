#!/usr/bin/env python3
"""Test all graph endpoints to verify data is loading."""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:8100"

async def test_graphs():
    """Test all graph endpoints."""
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # First, get login page to extract CSRF token and establish session
        print("📋 Fetching login page...")
        login_page = await client.get(f"{BASE_URL}/login")
        
        # Try login with default credentials
        print("🔐 Attempting login...")
        login_response = await client.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "changeme123"},
            follow_redirects=True
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
        
        print("✅ Login successful\n")
        
        # Test all graph endpoints
        endpoints = [
            ("/miner-data", "Miner Data"),
            ("/api/pool-comparison", "Pool Comparison"),
            ("/historical-metrics", "Historical Metrics"),
            ("/tuning/recommendations", "Tuning Recommendations"),
        ]
        
        for endpoint, name in endpoints:
            print(f"🔍 Testing {name} ({endpoint})...")
            try:
                response = await client.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            keys = list(data.keys())
                            print(f"   ✅ HTTP 200 | Keys: {keys[:5]}{'...' if len(keys) > 5 else ''}")
                            
                            # Show specific data details
                            if endpoint == "/miner-data":
                                total_miners = len([k for k in keys if k in 'ABCDEFGHIJ'])
                                print(f"      Miners found: {total_miners}")
                            elif endpoint == "/api/pool-comparison":
                                if 'local' in data and 'pool' in data:
                                    print(f"      Local data present: {bool(data['local'])}")
                                    print(f"      Pool data present: {bool(data['pool'])}")
                            elif endpoint == "/historical-metrics":
                                if 'data' in data:
                                    print(f"      Data points: {len(data['data'])}")
                            elif endpoint == "/tuning/recommendations":
                                if 'data' in data:
                                    print(f"      Recommendations: {data.get('count', 0)}")
                        elif isinstance(data, list):
                            print(f"   ✅ HTTP 200 | Array with {len(data)} items")
                        else:
                            print(f"   ✅ HTTP 200 | Type: {type(data).__name__}")
                    except Exception as e:
                        print(f"   ⚠️  HTTP 200 but invalid JSON: {e}")
                else:
                    print(f"   ❌ HTTP {response.status_code}")
                    print(f"      Response: {response.text[:100]}")
            except Exception as e:
                print(f"   ❌ Error: {e}")
            print()

if __name__ == "__main__":
    asyncio.run(test_graphs())
