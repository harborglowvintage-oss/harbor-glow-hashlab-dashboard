import httpx
from fastapi import APIRouter

router = APIRouter()

async def fetch_btc_price_and_change():
    sources = [
        ("coingecko", "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", lambda j: (j["bitcoin"]["usd"], j["bitcoin"].get("usd_24h_change"))),
        ("binance", "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", lambda j: (float(j["lastPrice"]), float(j["priceChangePercent"]))),
        ("bitstamp", "https://www.bitstamp.net/api/v2/ticker/btcusd/", lambda j: (float(j["last"]), (float(j["last"]) - float(j["open"])) / float(j["open"]) * 100 if float(j["open"]) else None))
    ]
    prices = []
    changes = []
    async with httpx.AsyncClient(timeout=5) as client:
        for name, url, parser in sources:
            try:
                r = await client.get(url)
                j = r.json()
                price, change = parser(j)
                prices.append(price)
                if change is not None:
                    changes.append(change)
            except Exception:
                continue
    if prices:
        avg_price = sum(prices) / len(prices)
        avg_change = sum(changes) / len(changes) if changes else None
        return {"success": True, "price": avg_price, "change_24h": avg_change, "sources": len(prices)}
    return {"success": False, "error": "No price data"}

@router.get("/btc-price-24h")
async def btc_price_24h():
    return await fetch_btc_price_and_change()
