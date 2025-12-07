# Harbor Glow HashLab Dashboard

A fully custom Bitcoin mining dashboard built for Harbor Glow HashLab — real-time miner analytics, ASIC temps, fan/PSU visuals, network monitoring, Luxor API integration, and interactive UI effects with a stunning Digital-7 neon green UI theme.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-00ff41?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-00ff41?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-00ff41?style=for-the-badge&logo=fastapi)

## ✨ Features

- **Real-time ASIC Monitoring**: Direct CGMiner API integration for live hashrate, temperature, and performance metrics
- **Chip Temperature Parsing**: Individual chip temperature monitoring with visual status indicators
- **Network Analytics**: Latency monitoring, packet loss tracking, and pool connectivity status
- **Luxor API Integration**: Pool statistics including 1h/24h hashrate, worker status, and revenue tracking
- **Digital-7 Neon UI**: Stunning neon green theme with custom animations and particle effects
- **WebSocket Updates**: Real-time data streaming with automatic reconnection
- **Interactive Animations**: Smooth transitions, glowing effects, and responsive visualizations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🎨 UI Theme

The dashboard features a custom Digital-7 monospace font style with:
- Neon green (#00ff41) primary color with glow effects
- Dark background (#0a0e1a) for optimal contrast
- Animated particle background system
- Real-time data visualization with smooth transitions
- Temperature gauges with color-coded warnings

## 🏗️ Architecture

```
harbor-glow-hashlab-dashboard/
├── app/
│   ├── api/
│   │   └── routes.py          # FastAPI routes and WebSocket
│   ├── core/
│   │   └── config.py          # Configuration management
│   ├── models/
│   │   └── miner.py           # Data models (Pydantic)
│   └── services/
│       ├── asic_monitor.py    # ASIC CGMiner API integration
│       ├── network_monitor.py # Network statistics monitoring
│       └── luxor_api.py       # Luxor pool API client
├── static/
│   ├── css/
│   │   ├── styles.css         # Main stylesheet
│   │   └── digital7.css       # Digital-7 font theme
│   └── js/
│       ├── animations.js      # Particle system & animations
│       └── dashboard.js       # WebSocket client & data updates
├── templates/
│   └── index.html             # Main dashboard template
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
└── .env.example              # Environment configuration template

```

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- ASIC miner with CGMiner API enabled (optional for testing)
- Luxor API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harborglowvintage-oss/harbor-glow-hashlab-dashboard.git
   cd harbor-glow-hashlab-dashboard
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run the dashboard**
   ```bash
   python main.py
   ```

6. **Access the dashboard**
   Open your browser and navigate to `http://localhost:8000`

## ⚙️ Configuration

Edit the `.env` file to configure your dashboard:

```env
# Luxor API Configuration
LUXOR_API_KEY=your_luxor_api_key_here
LUXOR_API_URL=https://api.luxor.tech/graphql

# ASIC Miner Configuration
ASIC_HOST=192.168.1.100
ASIC_PORT=4028
ASIC_TIMEOUT=5

# Network Monitoring
NETWORK_CHECK_INTERVAL=10
POOL_URLS=stratum+tcp://pool1.example.com:3333,stratum+tcp://pool2.example.com:3333

# Dashboard Settings
DASHBOARD_REFRESH_RATE=5
ENABLE_ANIMATIONS=true

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

## 📡 API Endpoints

### REST API

- `GET /` - Main dashboard interface
- `GET /api/stats` - Get current mining statistics (JSON)
- `GET /health` - Health check endpoint

### WebSocket

- `WS /ws` - Real-time data streaming

Example WebSocket response:
```json
{
  "asic_stats": {
    "hashrate": 95.5,
    "temperature": 72.5,
    "fan_speed": 4800,
    "power_usage": 2865,
    "uptime": 86400,
    "accepted_shares": 12543,
    "rejected_shares": 42,
    "hw_errors": 3,
    "pool_status": "connected"
  },
  "chip_temps": [
    {"chip_id": 1, "temperature": 71.2, "status": "normal"},
    {"chip_id": 2, "temperature": 73.5, "status": "normal"}
  ],
  "network_stats": {
    "latency": 45.2,
    "packet_loss": 0.01,
    "connection_status": "connected"
  },
  "luxor_stats": {
    "hashrate_1h": 95.5,
    "hashrate_24h": 94.2,
    "workers_online": 3,
    "efficiency": 98.5,
    "revenue_24h": 0.00012
  }
}
```

## 🔧 Development

### Running in Development Mode

```bash
# Enable debug mode in .env
DEBUG=true

# Run with auto-reload
python main.py
```

### Testing ASIC Connection

Test your CGMiner API connection:
```python
from app.services.asic_monitor import asic_monitor

stats = asic_monitor.get_stats()
print(stats)
```

## 🎯 Features Breakdown

### ASIC Temperature Parsing
- Reads temperature data from CGMiner API
- Parses individual chip temperatures
- Color-coded status indicators (normal, warning, critical)
- Real-time visual alerts for overheating

### Network Monitoring
- Pool connectivity checks with latency measurement
- Packet loss calculation
- Network I/O statistics tracking
- Connection status visualization

### Luxor API Integration
- GraphQL API integration for pool statistics
- Worker status monitoring
- Hashrate history tracking
- Revenue estimation and efficiency metrics

### Custom Animations
- Particle system background with WebGL acceleration
- Real-time hashrate chart with gradient fills
- Smooth number transitions using easing functions
- Temperature gauge animations with color gradients
- Glow effects and pulsing animations

## 🛠️ Customization

### Changing the Theme Color

Edit `/static/css/styles.css`:
```css
:root {
    --neon-green: #00ff41;        /* Primary color */
    --neon-green-bright: #39ff14; /* Bright accent */
    --neon-green-dim: #00cc33;    /* Dim accent */
}
```

### Adjusting Refresh Rate

Edit `.env`:
```env
DASHBOARD_REFRESH_RATE=5  # Update interval in seconds
```

### Adding Custom Metrics

1. Add model in `app/models/miner.py`
2. Update service in `app/services/`
3. Add route in `app/api/routes.py`
4. Update UI in `templates/index.html`
5. Add visualization in `static/js/dashboard.js`

## 📊 Monitoring Multiple Miners

To monitor multiple ASIC miners, you can run multiple instances with different configurations or extend the code to support multiple miners in a single dashboard.

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check firewall settings
- Verify correct port configuration
- Ensure no reverse proxy issues

### ASIC Connection Failures
- Verify CGMiner API is enabled on your miner
- Check IP address and port settings
- Test network connectivity to the miner

### Luxor API Issues
- Verify API key is correct
- Check API rate limits
- Ensure proper GraphQL query format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Luxor Mining for their API
- CGMiner for ASIC monitoring capabilities
- The Bitcoin mining community

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Built with ⚡ by Harbor Glow Vintage** 

*Making Bitcoin mining beautiful, one dashboard at a time.*
