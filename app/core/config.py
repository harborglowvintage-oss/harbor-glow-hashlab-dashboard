from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Luxor API Configuration
    luxor_api_key: str = ""
    luxor_api_url: str = "https://api.luxor.tech/graphql"
    
    # ASIC Miner Configuration
    asic_host: str = "192.168.1.100"
    asic_port: int = 4028
    asic_timeout: int = 5
    
    # Network Monitoring
    network_check_interval: int = 10
    pool_urls: str = ""
    
    # Dashboard Settings
    dashboard_refresh_rate: int = 5
    enable_animations: bool = True
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
