import asyncio
import time
import logging
from typing import Dict
import psutil
from app.models.miner import NetworkStats
from app.core.config import settings

logger = logging.getLogger(__name__)


class NetworkMonitor:
    """Monitor network connectivity and performance."""
    
    def __init__(self):
        self.pool_urls = self._parse_pool_urls()
        self.last_check = 0
    
    def _parse_pool_urls(self):
        """Parse pool URLs from settings."""
        if not settings.pool_urls:
            return []
        return [url.strip() for url in settings.pool_urls.split(',')]
    
    async def ping_host(self, host: str, port: int = 3333, timeout: float = 2.0) -> float:
        """Ping a host and return latency in ms."""
        try:
            start = time.time()
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=timeout
            )
            latency = (time.time() - start) * 1000
            writer.close()
            await writer.wait_closed()
            return latency
        except Exception as e:
            logger.debug(f"Failed to ping {host}:{port} - {e}")
            return -1.0
    
    async def check_pool_connectivity(self) -> Dict[str, float]:
        """Check connectivity to all configured pools."""
        results = {}
        
        for pool_url in self.pool_urls:
            # Parse stratum URL
            if "://" in pool_url:
                pool_url = pool_url.split("://")[1]
            
            if ":" in pool_url:
                host, port = pool_url.split(":")
                port = int(port)
            else:
                host = pool_url
                port = 3333
            
            latency = await self.ping_host(host, port)
            results[host] = latency
        
        return results
    
    def get_network_stats(self) -> Dict:
        """Get network interface statistics."""
        try:
            net_io = psutil.net_io_counters()
            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "errin": net_io.errin,
                "errout": net_io.errout,
                "dropin": net_io.dropin,
                "dropout": net_io.dropout,
            }
        except Exception as e:
            logger.error(f"Failed to get network stats: {e}")
            return {}
    
    async def get_stats(self) -> NetworkStats:
        """Get current network statistics."""
        # Check pool connectivity
        pool_latencies = await self.check_pool_connectivity()
        
        # Calculate average latency
        valid_latencies = [l for l in pool_latencies.values() if l > 0]
        avg_latency = sum(valid_latencies) / len(valid_latencies) if valid_latencies else 0.0
        
        # Check connection status
        connection_status = "connected" if valid_latencies else "disconnected"
        
        # Get network I/O stats
        net_stats = self.get_network_stats()
        
        # Calculate packet loss (simplified estimation)
        packet_loss = 0.0
        if net_stats:
            total_errors = net_stats.get("errin", 0) + net_stats.get("errout", 0)
            total_packets = net_stats.get("packets_sent", 0) + net_stats.get("packets_recv", 0)
            if total_packets > 0:
                packet_loss = (total_errors / total_packets) * 100
        
        return NetworkStats(
            latency=avg_latency,
            packet_loss=packet_loss,
            bandwidth_up=0.0,  # Would need historical data for rate calculation
            bandwidth_down=0.0,
            connection_status=connection_status
        )


# Singleton instance
network_monitor = NetworkMonitor()
