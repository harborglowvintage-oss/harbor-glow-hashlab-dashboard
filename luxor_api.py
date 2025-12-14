import logging
import os

import httpx

logger = logging.getLogger("luxor_api")

# Luxor account configuration
LUXOR_USERNAME = "harborglowvintage"
LUXOR_BASE_URL = "https://app.luxor.tech/api/v2"
LUXOR_DEFAULT_SUBACCOUNT = "harborglowvintage"


async def get_luxor_data(api_key: str | None = None, subaccount: str | None = None):
    """
    Fetch worker data from the Luxor pool REST API v2 so the dashboard can
    compare local miner metrics to pool-side statistics.
    
    Endpoint: /api/v2/pool/workers/BTC
    Returns worker hashrate, efficiency, and status for the specified subaccount.
    """
    api_key = api_key or os.getenv("LUXOR_API_KEY")
    subaccount = subaccount or os.getenv("LUXOR_SUBACCOUNT") or LUXOR_DEFAULT_SUBACCOUNT

    if not api_key:
        logger.warning("LUXOR_API_KEY not found.")
        return None

    if not subaccount:
        logger.warning("LUXOR_SUBACCOUNT not configured.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    # Query parameters for filtering workers
    params = {
        "subaccount_names": subaccount,
        "status": "active",
        "limit": 250,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            url = f"{LUXOR_BASE_URL}/pool/workers/BTC"
            response = await client.get(url, headers=headers, params=params)

        response.raise_for_status()
        data = response.json()

        logger.debug("Luxor API response: %s", data)
        
        # Transform Luxor API response format to match expected structure
        # The API returns a list of workers or paginated results
        workers = data.get("data", data.get("workers", []))
        if not isinstance(workers, list):
            workers = [workers] if workers else []

        logger.debug("Luxor API returned %d workers", len(workers))
        return workers

    except httpx.HTTPStatusError as exc:
        body = exc.response.text if exc.response is not None else "no body"
        logger.error("Luxor API HTTP error (%s): %s", exc.response.status_code, body)
        return None
    except Exception as exc:
        logger.error("Error fetching Luxor data: %s", exc)
        return None
