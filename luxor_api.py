import os
import httpx
import logging

logger = logging.getLogger("luxor_api")

# Updated to use REST API v1 endpoint per Luxor documentation
LUXOR_BASE_URL = "https://app.luxor.tech/api/v1"

async def get_luxor_data(api_key: str = None):
    """
    Fetches miner/worker data from Luxor pool REST API.
    Returns a list of workers with their hashrate and efficiency data.
    """
    if not api_key:
        api_key = os.getenv("LUXOR_API_KEY")
    
    if not api_key:
        logger.warning("LUXOR_API_KEY not found.")
        return None

    # Correct header format per Luxor API documentation
    headers = {
        "authorization": api_key,
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            # Reduced timeout to prevent hanging the dashboard if API is unreachable
            # Fetch workspace data (main endpoint per Luxor API documentation)
            url = f"{LUXOR_BASE_URL}/workspace"
            response = await client.get(url, headers=headers, timeout=3.0)
            
            if response.status_code == 403:
                logger.error("Luxor API: 403 Forbidden - API key may lack required permissions")
                return None
            
            response.raise_for_status()
            data = response.json()
            
            logger.debug(f"Luxor API response: {data}")
            return data
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Luxor API HTTP error ({e.response.status_code}): {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Error fetching Luxor data: {e}")
        return None
