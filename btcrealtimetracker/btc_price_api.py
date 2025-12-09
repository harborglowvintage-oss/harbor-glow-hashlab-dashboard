import httpx
from fastapi import APIRouter

router = APIRouter()

async def fetch_btc_price():
    sources = [
        ("coingecko", "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", lambda j: j["bitcoin"]["usd"]),
        ("binance", "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", lambda j: float(j["price"])),
        ("bitstamp", "https://www.bitstamp.net/api/v2/ticker/btcusd/", lambda j: float(j["last"]))
    ]
    prices = []
    async with httpx.AsyncClient(timeout=5) as client:
        for name, url, parser in sources:
            try:
                r = await client.get(url)
                j = r.json()
                prices.append(parser(j))
            except Exception:
                continue
    if prices:
        avg_price = sum(prices) / len(prices)
        return {"success": True, "price": avg_price, "sources": len(prices)}
    return {"success": False, "error": "No price data"}

@router.get("/btc-price")
async def btc_price():
    return await fetch_btc_price()
