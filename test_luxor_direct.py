#!/usr/bin/env python3
"""Test Luxor API connection directly."""

import asyncio
import os
from dotenv import load_dotenv
import sys

# Add project to path
sys.path.insert(0, '/home/hgvboss/Desktop/goldsunproject')

load_dotenv()

async def test_luxor():
    from luxor_api import debug_luxor_connection, get_luxor_data
    
    print("=" * 60)
    print("🔍 LUXOR API DEBUG TEST")
    print("=" * 60 + "\n")
    
    # Test debug connection
    print("📡 Testing debug connection...")
    debug_result = await debug_luxor_connection()
    
    for key, value in debug_result.items():
        if key == "response_preview":
            preview = str(value)[:80].replace("\n", " ")
            print(f"   {key}: {preview}...")
        else:
            print(f"   {key}: {value}")
    
    print("\n" + "=" * 60)
    print("📊 Testing production get_luxor_data()...")
    print("=" * 60 + "\n")
    
    data = await get_luxor_data()
    
    if data:
        print(f"✅ Got {len(data)} workers from Luxor API")
        if len(data) > 0:
            first_worker = data[0]
            print(f"\n   Sample worker:")
            for key, value in list(first_worker.items())[:5]:
                print(f"      {key}: {value}")
    else:
        print("❌ No data returned from Luxor API")

if __name__ == "__main__":
    asyncio.run(test_luxor())
