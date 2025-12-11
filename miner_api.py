import asyncio
import json
import logging
from time import time
from typing import Any, Dict, List, Optional

import httpx


STATUS_THRESHOLD_TEMP = 75.0  # degrees Celsius
STATUS_REJECT_RATIO = 0.05    # 5% reject rate threshold
CACHE_TTL_SECONDS = 60        # TTL for active miners cache

_last_active_miners_cache = {
    "data": [],
    "timestamp": 0,
}

logger = logging.getLogger(__name__)


def _extract_numeric(value: Any) -> Optional[float]:
    try:
        number = float(value)
        if number != number:  # NaN guard
            return None
        return number
    except (TypeError, ValueError):
        return None


def _determine_status(payload: Dict[str, Any], alive: bool) -> str:
    if not alive:
        return "⚠️ Offline"

    temps = payload.get("asicTemps") or []
    temp_candidates = [
        _extract_numeric(payload.get("chipTemp")),
        _extract_numeric(payload.get("temp")),
        _extract_numeric(max(temps) if temps else None)
    ]
    asic_temp = next((t for t in temp_candidates if t is not None), None)

    accepted = _extract_numeric(payload.get("sharesAccepted")) or 0.0
    rejected = _extract_numeric(payload.get("sharesRejected")) or 0.0

    if asic_temp and asic_temp > STATUS_THRESHOLD_TEMP:
        return "⚠️ OVERHEATING"
    if accepted == 0.0 and rejected > 0:
        return "⚠️ High Reject Rate"
    if rejected > accepted * STATUS_REJECT_RATIO:
        return "⚠️ High Reject Rate"
    return "✅ OK"


async def fetch_miner_stats(name: str, ip: str) -> Dict[str, Any]:
    url = f"http://{ip}/api/system/info"

    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(url)
            response.raise_for_status()
            try:
                data = response.json()
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON response from {ip}") from exc

        if "minerModel" in data:
            mtype = "BG02"
        elif "deviceModel" in data:
            mtype = "NERDQ"
        else:
            mtype = "Unknown"

        hashrate_1m = data.get("hashRate_1m", data.get("hashRate", 0)) / 1000
        hashrate_24h = data.get("hashrate_24h", data.get("hashRate_1d", 0)) / 1000

        power = data.get("power", 0)
        efficiency = power / hashrate_1m if hashrate_1m > 0 else 0

        miner_payload = {
            "name": name,
            "type": mtype,
            "hashrate_1m": hashrate_1m,
            "hashrate_24h": hashrate_24h,
            "efficiency": efficiency,
            "temp": data.get("temp", data.get("vrTemp", 0)),
            "chipTemp": data.get("chipTemp", 0),
            "power": power,
            "sharesAccepted": data.get("sharesAccepted", 0),
            "sharesRejected": data.get("sharesRejected", 0),
            "asicCount": data.get("asicCount", 0),
            "asicTemps": data.get("asicTemps", []),
            "uptime": data.get("uptimeSeconds", 0),
            "fanrpm": data.get("fanrpm", data.get("fanSpeed", 0)),
            "frequency": data.get("frequency", 0),
            "voltage": data.get("coreVoltageActual", data.get("voltage", 0)),
            "wifiRSSI": data.get("wifiRSSI", 0),
            "bestDiff": data.get("bestDiff", data.get("bestSessionDiff", 0)),
            "poolDifficulty": data.get("poolDifficulty", data.get("stratumDifficulty", 0)),
            "alive": True,
        }
        miner_payload["status"] = _determine_status(miner_payload, alive=True)
        return miner_payload

    except Exception as e:
        logger.warning("Failed to fetch stats for %s (%s): %s", name, ip, e)
        logger.debug("Miner %s at %s marked as offline.", name, ip)
        return {
            "name": name,
            "type": "OFFLINE",
            "hashrate_1m": 0,
            "hashrate_24h": 0,
            "efficiency": 0,
            "temp": 0,
            "chipTemp": 0,
            "power": 0,
            "sharesAccepted": 0,
            "sharesRejected": 0,
            "asicCount": 0,
            "asicTemps": [],
            "uptime": 0,
            "alive": False,
            "status": _determine_status({}, alive=False),
        }


async def get_active_miners(miner_list: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Fetch stats for the provided miners and return only those marked alive."""
    tasks = [fetch_miner_stats(miner["name"], miner["ip"]) for miner in miner_list]
    all_stats = await asyncio.gather(*tasks)
    return [miner for miner in all_stats if miner.get("alive")]


async def get_cached_active_miners(miner_list: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Cached variant of get_active_miners to avoid hammering the rigs."""
    now = time()
    if now - _last_active_miners_cache["timestamp"] > CACHE_TTL_SECONDS:
        logger.info("Refreshing active miner cache...")
        active = await get_active_miners(miner_list)
        _last_active_miners_cache["data"] = active
        _last_active_miners_cache["timestamp"] = now
    return _last_active_miners_cache["data"]
