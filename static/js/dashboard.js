// Dashboard Data Management and WebSocket Connection
class DashboardManager {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000;
        this.reconnectTimer = null;
        this.isConnected = false;
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupEventListeners();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.updateDashboard(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                // Attempt to reconnect
                this.reconnectTimer = setTimeout(() => {
                    this.connectWebSocket();
                }, this.reconnectInterval);
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }
    
    updateDashboard(data) {
        // Update last update time
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
        
        // Update ASIC stats
        if (data.asic_stats) {
            const asic = data.asic_stats;
            
            // Hashrate
            window.animateNumber(document.getElementById('hashrate'), asic.hashrate);
            window.hashrateChart.addData(asic.hashrate);
            window.hashrateChart.draw();
            
            // Temperature
            window.animateNumber(document.getElementById('temperature'), asic.temperature);
            const tempPercentage = Math.min((asic.temperature / 100) * 100, 100);
            window.animateGauge(document.getElementById('tempGaugeFill'), tempPercentage);
            
            // Power
            window.animateNumber(document.getElementById('power'), asic.power_usage);
            const powerPercentage = Math.min((asic.power_usage / 3500) * 100, 100);
            window.animateGauge(document.getElementById('efficiencyFill'), powerPercentage);
            
            // Shares
            document.getElementById('acceptedShares').textContent = asic.accepted_shares.toLocaleString();
            document.getElementById('rejectedShares').textContent = asic.rejected_shares.toLocaleString();
            document.getElementById('hwErrors').textContent = asic.hw_errors.toLocaleString();
            
            // System info
            this.updateUptime(asic.uptime);
            document.getElementById('fanSpeed').textContent = asic.fan_speed.toLocaleString();
            
            // Pool status
            const poolStatus = document.getElementById('poolStatus');
            poolStatus.textContent = asic.pool_status.charAt(0).toUpperCase() + asic.pool_status.slice(1);
            poolStatus.style.color = asic.pool_status === 'connected' ? '#00ff41' : '#ef4444';
        }
        
        // Update network stats
        if (data.network_stats) {
            const network = data.network_stats;
            
            window.animateNumber(document.getElementById('latency'), network.latency);
            window.animateNumber(document.getElementById('packetLoss'), network.packet_loss);
        }
        
        // Update Luxor stats
        if (data.luxor_stats) {
            const luxor = data.luxor_stats;
            
            window.animateNumber(document.getElementById('luxorHashrate1h'), luxor.hashrate_1h);
            window.animateNumber(document.getElementById('luxorHashrate24h'), luxor.hashrate_24h);
            document.getElementById('workersOnline').textContent = luxor.workers_online;
            document.getElementById('revenue24h').textContent = luxor.revenue_24h.toFixed(8);
            window.animateNumber(document.getElementById('efficiency'), luxor.efficiency);
        }
        
        // Update chip temperatures
        if (data.chip_temps && data.chip_temps.length > 0) {
            this.updateChipTemperatures(data.chip_temps);
        }
    }
    
    updateUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        document.getElementById('uptime').textContent = `${days}d ${hours}h ${minutes}m`;
    }
    
    updateChipTemperatures(chipTemps) {
        const container = document.getElementById('chipTemps');
        container.innerHTML = '';
        
        chipTemps.forEach(chip => {
            const chipElement = document.createElement('div');
            chipElement.className = `chip-temp ${chip.status}`;
            
            const chipId = document.createElement('div');
            chipId.className = 'chip-id';
            chipId.textContent = `Chip ${chip.chip_id}`;
            
            const chipValue = document.createElement('div');
            chipValue.className = 'chip-value digital-display';
            chipValue.textContent = `${chip.temperature.toFixed(1)}°C`;
            
            chipElement.appendChild(chipId);
            chipElement.appendChild(chipValue);
            container.appendChild(chipElement);
        });
    }
    
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden, pausing updates');
            } else {
                console.log('Page visible, resuming updates');
                if (!this.isConnected) {
                    this.connectWebSocket();
                }
            }
        });
        
        // Handle window unload
        window.addEventListener('beforeunload', () => {
            if (this.ws) {
                this.ws.close();
            }
        });
    }
    
    // Fallback to polling if WebSocket fails
    async pollData() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const data = await response.json();
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('Error polling data:', error);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Dashboard Manager');
    window.dashboardManager = new DashboardManager();
    
    // Fallback polling every 10 seconds if WebSocket is not connected
    setInterval(() => {
        if (!window.dashboardManager.isConnected) {
            console.log('WebSocket not connected, polling data');
            window.dashboardManager.pollData();
        }
    }, 10000);
});
