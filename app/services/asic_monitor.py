import socket
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.models.miner import ASICStats, ChipTemperature
from app.core.config import settings

logger = logging.getLogger(__name__)


class ASICMonitor:
    """Monitor and parse ASIC miner statistics."""
    
    def __init__(self, host: str = None, port: int = None, timeout: int = None):
        self.host = host or settings.asic_host
        self.port = port or settings.asic_port
        self.timeout = timeout or settings.asic_timeout
    
    def _send_command(self, command: str) -> Optional[Dict]:
        """Send command to ASIC miner via CGMiner API."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            sock.connect((self.host, self.port))
            
            sock.send(json.dumps({"command": command}).encode())
            response = b""
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                response += chunk
            
            sock.close()
            
            # Parse response
            response_str = response.decode('utf-8').strip('\x00')
            return json.loads(response_str)
        
        except (socket.error, json.JSONDecodeError, Exception) as e:
            logger.error(f"Error communicating with ASIC: {e}")
            return None
    
    def get_stats(self) -> ASICStats:
        """Get current ASIC statistics."""
        stats_data = self._send_command("stats")
        summary_data = self._send_command("summary")
        
        # Parse summary data for hashrate and shares
        hashrate = 0.0
        accepted = 0
        rejected = 0
        hw_errors = 0
        uptime = 0
        
        if summary_data and "SUMMARY" in summary_data:
            summary = summary_data["SUMMARY"][0] if summary_data["SUMMARY"] else {}
            hashrate = summary.get("GHS 5s", 0.0) / 1000.0  # Convert to TH/s
            accepted = summary.get("Accepted", 0)
            rejected = summary.get("Rejected", 0)
            hw_errors = summary.get("Hardware Errors", 0)
            uptime = summary.get("Elapsed", 0)
        
        # Parse stats for temperature and fan speed
        temperature = 0.0
        fan_speed = 0
        
        if stats_data and "STATS" in stats_data:
            stats = stats_data["STATS"][0] if stats_data["STATS"] else {}
            # Get average temperature from available temp sensors
            temps = [v for k, v in stats.items() if k.startswith("temp") and isinstance(v, (int, float))]
            temperature = sum(temps) / len(temps) if temps else 0.0
            fan_speed = stats.get("fan1", 0)
        
        # Get pool status
        pools_data = self._send_command("pools")
        pool_status = "disconnected"
        if pools_data and "POOLS" in pools_data:
            pools = pools_data["POOLS"]
            active_pools = [p for p in pools if p.get("Status") == "Alive"]
            pool_status = "connected" if active_pools else "disconnected"
        
        return ASICStats(
            hashrate=hashrate,
            temperature=temperature,
            fan_speed=fan_speed,
            power_usage=hashrate * 30.0,  # Estimate: ~30W per TH/s
            uptime=uptime,
            accepted_shares=accepted,
            rejected_shares=rejected,
            hw_errors=hw_errors,
            pool_status=pool_status,
            timestamp=datetime.now()
        )
    
    def get_chip_temperatures(self) -> List[ChipTemperature]:
        """Get individual chip temperature readings."""
        stats_data = self._send_command("stats")
        chip_temps = []
        
        if stats_data and "STATS" in stats_data:
            stats = stats_data["STATS"][0] if stats_data["STATS"] else {}
            
            # Parse temperature sensors (temp1, temp2, temp3, etc.)
            for key, value in stats.items():
                if key.startswith("temp") and isinstance(value, (int, float)):
                    chip_id = int(key.replace("temp", "").replace("_", ""))
                    status = "normal"
                    if value > 90:
                        status = "critical"
                    elif value > 80:
                        status = "warning"
                    
                    chip_temps.append(ChipTemperature(
                        chip_id=chip_id,
                        temperature=value,
                        status=status
                    ))
        
        return chip_temps


# Singleton instance
asic_monitor = ASICMonitor()
