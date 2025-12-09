import httpx

async def fetch_miner_stats(name, ip):
    url = f"http://{ip}/api/system/info"

    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(url)
            j = r.json()

        # Type detection
        if "minerModel" in j:
            mtype = "BG02"
        elif "deviceModel" in j:
            mtype = "NERDQ"
        else:
            mtype = "Unknown"

        # Hashrates
        hashrate_1m = j.get("hashRate_1m", j.get("hashRate", 0)) / 1000
        hashrate_24h = j.get("hashrate_24h", j.get("hashRate_1d", 0)) / 1000

        power = j.get("power", 0)
        efficiency = power / hashrate_1m if hashrate_1m > 0 else 0

        # Mask sensitive fields (never expose IP, internal IDs, or raw JSON)
        return {
            "name": name,
            "type": mtype,
            "hashrate_1m": hashrate_1m,
            "hashrate_24h": hashrate_24h,
            "efficiency": efficiency,
            "temp": j.get("temp", j.get("vrTemp", 0)),
            "chipTemp": j.get("chipTemp", 0),
            "power": power,
            "sharesAccepted": j.get("sharesAccepted", 0),
            "sharesRejected": j.get("sharesRejected", 0),
            "asicCount": j.get("asicCount", 0),
            "asicTemps": j.get("asicTemps", []),
            "uptime": j.get("uptimeSeconds", 0),
            "alive": True,
            "ip": ip
        }

    except:
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
            "ip": ip
        }
