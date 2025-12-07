from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ASICStats(BaseModel):
    """ASIC miner statistics."""
    hashrate: float = 0.0
    temperature: float = 0.0
    fan_speed: int = 0
    power_usage: float = 0.0
    uptime: int = 0
    accepted_shares: int = 0
    rejected_shares: int = 0
    hw_errors: int = 0
    pool_status: str = "disconnected"
    timestamp: datetime = datetime.now()


class ChipTemperature(BaseModel):
    """Individual chip temperature data."""
    chip_id: int
    temperature: float
    status: str = "normal"  # normal, warning, critical


class NetworkStats(BaseModel):
    """Network monitoring statistics."""
    latency: float = 0.0
    packet_loss: float = 0.0
    bandwidth_up: float = 0.0
    bandwidth_down: float = 0.0
    connection_status: str = "unknown"
    timestamp: datetime = datetime.now()


class LuxorStats(BaseModel):
    """Luxor pool statistics."""
    hashrate_1h: float = 0.0
    hashrate_24h: float = 0.0
    workers_online: int = 0
    efficiency: float = 0.0
    revenue_24h: float = 0.0
    timestamp: datetime = datetime.now()


class DashboardData(BaseModel):
    """Combined dashboard data."""
    asic_stats: ASICStats
    chip_temps: List[ChipTemperature] = []
    network_stats: NetworkStats
    luxor_stats: Optional[LuxorStats] = None
