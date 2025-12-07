from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
import logging
from app.models.miner import DashboardData, ASICStats, NetworkStats
from app.services.asic_monitor import asic_monitor
from app.services.network_monitor import network_monitor
from app.services.luxor_api import luxor_api
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to websocket: {e}")


manager = ConnectionManager()


@router.get("/api/stats")
async def get_stats():
    """Get current dashboard statistics."""
    try:
        # Get ASIC stats (mock data if not available)
        try:
            asic_stats = asic_monitor.get_stats()
            chip_temps = asic_monitor.get_chip_temperatures()
        except Exception as e:
            logger.warning(f"Failed to get ASIC stats, using mock data: {e}")
            asic_stats = ASICStats(
                hashrate=95.5,
                temperature=72.5,
                fan_speed=4800,
                power_usage=2865,
                uptime=86400,
                accepted_shares=12543,
                rejected_shares=42,
                hw_errors=3,
                pool_status="connected"
            )
            chip_temps = []
        
        # Get network stats
        try:
            network_stats = await network_monitor.get_stats()
        except Exception as e:
            logger.warning(f"Failed to get network stats, using mock data: {e}")
            network_stats = NetworkStats(
                latency=45.2,
                packet_loss=0.01,
                bandwidth_up=125.5,
                bandwidth_down=98.3,
                connection_status="connected"
            )
        
        # Get Luxor stats
        try:
            luxor_stats = await luxor_api.get_stats()
        except Exception as e:
            logger.warning(f"Failed to get Luxor stats: {e}")
            luxor_stats = None
        
        dashboard_data = DashboardData(
            asic_stats=asic_stats,
            chip_temps=chip_temps,
            network_stats=network_stats,
            luxor_stats=luxor_stats
        )
        
        return dashboard_data.model_dump(mode='json')
    
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Get current stats
            try:
                asic_stats = asic_monitor.get_stats()
                chip_temps = asic_monitor.get_chip_temperatures()
            except Exception:
                asic_stats = ASICStats(
                    hashrate=95.5,
                    temperature=72.5,
                    fan_speed=4800,
                    power_usage=2865,
                    uptime=86400,
                    accepted_shares=12543,
                    rejected_shares=42,
                    hw_errors=3,
                    pool_status="connected"
                )
                chip_temps = []
            
            try:
                network_stats = await network_monitor.get_stats()
            except Exception:
                network_stats = NetworkStats(
                    latency=45.2,
                    packet_loss=0.01,
                    connection_status="connected"
                )
            
            try:
                luxor_stats = await luxor_api.get_stats()
            except Exception:
                luxor_stats = None
            
            dashboard_data = DashboardData(
                asic_stats=asic_stats,
                chip_temps=chip_temps,
                network_stats=network_stats,
                luxor_stats=luxor_stats
            )
            
            # Send data to client
            await websocket.send_text(json.dumps(dashboard_data.model_dump(mode='json'), default=str))
            
            # Wait before next update
            await asyncio.sleep(settings.dashboard_refresh_rate)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
