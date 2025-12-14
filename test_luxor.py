import asyncio
import os
from dotenv import load_dotenv
from luxor_api import get_luxor_data

load_dotenv()

async def test_luxor():
    print(f"Testing Luxor API with key: {os.getenv('LUXOR_API_KEY')[:5]}...")
    data = await get_luxor_data()
    if data:
        print("Success! Received data:")
        print(data)
    else:
        print("Failed to get data.")

if __name__ == "__main__":
    asyncio.run(test_luxor())
