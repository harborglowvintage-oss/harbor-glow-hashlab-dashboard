import logging
import os
from typing import Optional, List, Dict

import httpx

logger = logging.getLogger("luxor_api")

# Luxor account configuration
LUXOR_USERNAME = "harborglowvintage"
LUXOR_BASE_URL = "https://app.luxor.tech/api/v2"
LUXOR_DEFAULT_SUBACCOUNT = "harborglowvintage"


async def debug_luxor_connection() -> Dict:
    """Debug function to verify Luxor API connection and configuration."""
    api_key = os.getenv("LUXOR_API_KEY")
    subaccount = os.getenv("LUXOR_SUBACCOUNT") or LUXOR_DEFAULT_SUBACCOUNT
    
    config = {
        "api_key_set": bool(api_key),
        "api_key_preview": f"{api_key[:10]}...{api_key[-5:]}" if api_key else "NOT SET",
        "subaccount": subaccount,
        "base_url": LUXOR_BASE_URL,
        "endpoint": f"{LUXOR_BASE_URL}/pool/workers/BTC",
    }
    
    # Test the connection
    if not api_key:
        config["connection_status"] = "FAILED: API key not set"
        return config
    
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    
    params = {
        "subaccount_names": subaccount,
        "status": "ACTIVE",
        "limit": 10,  # Small limit for debug
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            url = f"{LUXOR_BASE_URL}/pool/workers/BTC"
            logger.debug("📡 Luxor API Call → %s | params: %s", url, params)
            response = await client.get(url, headers=headers, params=params)
        
        config["connection_status"] = f"SUCCESS: HTTP {response.status_code}"
        config["response_length"] = len(response.text)
        config["response_preview"] = response.text[:200]
        
        if response.status_code == 200:
            try:
                data = response.json()
                config["json_valid"] = True
                config["json_structure"] = list(data.keys()) if isinstance(data, dict) else "list"
            except Exception as e:
                config["json_valid"] = False
                config["json_error"] = str(e)
        
        return config
    except Exception as e:
        config["connection_status"] = f"FAILED: {str(e)}"
        return config


async def get_luxor_data(api_key: str | None = None, subaccount: str | None = None) -> Optional[List[Dict]]:
    """
    Fetch worker data from the Luxor pool REST API v2 so the dashboard can
    compare local miner metrics to pool-side statistics.
    
    Endpoint: /api/v2/pool/workers/BTC
    Query param: subaccount_names (not subaccount - per official v2 docs)
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

    # Use Authorization header with API key
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    
    # Query parameters for filtering workers
    params = {
        "subaccount_names": subaccount,
        "status": "ACTIVE",
        "limit": 250,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            url = f"{LUXOR_BASE_URL}/pool/workers/BTC"
            logger.debug("📡 Luxor API Call → %s | params: %s", url, params)
            response = await client.get(url, headers=headers, params=params)

        response.raise_for_status()
        data = response.json()

        logger.debug("Luxor API response received: %s", data)
        
        # Transform Luxor API response format to match expected structure
        # The API returns a list of workers or paginated results
        workers = data.get("data", data.get("workers", []))
        if not isinstance(workers, list):
            workers = [workers] if workers else []
        
        # Filter to only ACTIVE workers (double-check even though we filter in query)
        active_workers = [w for w in workers if w.get("status", "").upper() == "ACTIVE"]
        logger.debug("Luxor API returned %d total workers, %d active", len(workers), len(active_workers))

        # Calculate aggregate hashrate for logging
        total_hashrate = sum(w.get("hashrate", 0) for w in active_workers)
        total_hashrate_ths = total_hashrate / 1e12 if total_hashrate > 0 else 0
        
        logger.debug("Luxor API active workers total hashrate: %.2f TH/s", total_hashrate_ths)
        return active_workers

    except httpx.HTTPStatusError as exc:
        body = exc.response.text if exc.response is not None else "no body"
        logger.error("Luxor API HTTP error (%s): %s", exc.response.status_code, body)
        return None
    except Exception as exc:
        logger.error("Error fetching Luxor data: %s", exc)
        return None
