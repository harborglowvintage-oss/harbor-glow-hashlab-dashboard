import httpx
import logging
from typing import Optional
from app.models.miner import LuxorStats
from app.core.config import settings

logger = logging.getLogger(__name__)


class LuxorAPI:
    """Integration with Luxor Mining Pool API."""
    
    def __init__(self):
        self.api_url = settings.luxor_api_url
        self.api_key = settings.luxor_api_key
        self.headers = {
            "Content-Type": "application/json",
            "x-lux-api-key": self.api_key
        }
    
    async def get_hashrate(self, username: str) -> Optional[dict]:
        """Get hashrate data from Luxor API."""
        if not self.api_key:
            logger.warning("Luxor API key not configured")
            return None
        
        query = """
        query getHashrate($username: String!) {
            getHashrateHistory(
                username: $username
                inputInterval: _1_HOUR
                first: 24
            ) {
                edges {
                    node {
                        timestamp
                        hashrate
                    }
                }
            }
        }
        """
        
        variables = {"username": username}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json={"query": query, "variables": variables},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch Luxor hashrate: {e}")
            return None
    
    async def get_workers(self, username: str) -> Optional[dict]:
        """Get worker status from Luxor API."""
        if not self.api_key:
            return None
        
        query = """
        query getWorkers($username: String!) {
            getWorkers(username: $username) {
                edges {
                    node {
                        workerName
                        status
                        hashrate
                    }
                }
            }
        }
        """
        
        variables = {"username": username}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    json={"query": query, "variables": variables},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch Luxor workers: {e}")
            return None
    
    async def get_stats(self, username: str = "demo") -> Optional[LuxorStats]:
        """Get aggregated statistics from Luxor API."""
        if not self.api_key:
            logger.info("Luxor API not configured, returning mock data")
            # Return mock data for demo purposes
            return LuxorStats(
                hashrate_1h=95.5,
                hashrate_24h=94.2,
                workers_online=3,
                efficiency=98.5,
                revenue_24h=0.00012
            )
        
        try:
            # Get hashrate and worker data
            hashrate_data = await self.get_hashrate(username)
            worker_data = await self.get_workers(username)
            
            # Parse hashrate data
            hashrate_1h = 0.0
            hashrate_24h = 0.0
            
            if hashrate_data and "data" in hashrate_data:
                edges = hashrate_data["data"].get("getHashrateHistory", {}).get("edges", [])
                if edges:
                    # Get most recent hashrate for 1h
                    hashrate_1h = edges[0]["node"]["hashrate"] / 1e12  # Convert to TH/s
                    # Average last 24 entries for 24h
                    hashrates = [edge["node"]["hashrate"] / 1e12 for edge in edges]
                    hashrate_24h = sum(hashrates) / len(hashrates) if hashrates else 0.0
            
            # Parse worker data
            workers_online = 0
            if worker_data and "data" in worker_data:
                workers = worker_data["data"].get("getWorkers", {}).get("edges", [])
                workers_online = sum(1 for w in workers if w["node"]["status"] == "ONLINE")
            
            # Calculate efficiency (accepted / (accepted + rejected) * 100)
            efficiency = 98.5  # Mock value, would need more detailed API data
            
            # Revenue estimation (mock value)
            revenue_24h = hashrate_24h * 0.0000012  # Rough estimate
            
            return LuxorStats(
                hashrate_1h=hashrate_1h,
                hashrate_24h=hashrate_24h,
                workers_online=workers_online,
                efficiency=efficiency,
                revenue_24h=revenue_24h
            )
        
        except Exception as e:
            logger.error(f"Failed to get Luxor stats: {e}")
            return None


# Singleton instance
luxor_api = LuxorAPI()
