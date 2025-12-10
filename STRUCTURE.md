# Project Structure

This repository contains **two separate FastAPI applications**:

## 1. Harbor Glow HashLab Dashboard (Production App)

Root-level application for mining fleet monitoring and analytics.

```
goldsunproject/
├── main.py                          # ✅ Dashboard entry point
├── miner_api.py                     # Miner data fetching
├── data_logger.py                   # Metrics CSV logging
├── auth_config.json                 # Credentials
├── miners_config.json               # Fleet configuration
│
├── templates/
│   ├── dashboard.html               # Main dashboard
│   └── charts.html                  # Analytics page
│
├── static/
│   ├── style.css                    # Dashboard styles
│   ├── dashboard.js                 # Real-time updates
│   ├── gauges.js                    # Speed/efficiency gauges
│   ├── nixie.js                     # Retro power calculator
│   ├── psu-fan.js                   # Fan animation
│   ├── btc-realtime-orb.js          # BTC price tracker
│   ├── historical-charts.js         # Analytics charts
│   └── [12 more canvas/animation files]
│
├── btcrealtimetracker/
│   ├── btc_price_api.py             # Current BTC price router
│   └── btc_price_api_24h.py         # 24h BTC price router
│
└── data_logs/
    └── miner_metrics.csv            # Historical data
```

**Run Locally:**
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Run via Cloudflare Tunnel:**
```bash
cloudflared tunnel run 0fa91577-f370-4fc9-a54a-afe728d6ceba
```

**Run on Render:**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 2. FastAPI Starter Template

Template application in `app/` folder for bootstrapping new projects.

```
app/
├── __init__.py                      # Package marker
├── main.py                          # ✅ Starter entry point
├── models.py                        # Pydantic schemas & settings
├── routes.py                        # API endpoints
│
├── templates/
│   └── index.html                   # Simple homepage
│
└── static/
    └── starter.css                  # Template styles
```

**Run Starter:**
```bash
python -m uvicorn app.main:app --reload
```

---

## Key Differences

| Aspect | Dashboard | Starter |
|--------|-----------|---------|
| **Entry Point** | `/main.py` | `/app/main.py` |
| **Purpose** | Mining fleet monitoring | Template for new projects |
| **Complexity** | Production-grade | Minimal/educational |
| **Run Command** | `uvicorn main:app` | `uvicorn app.main:app` |
| **Dependencies** | httpx, jinja2, starlette | fastapi, python-dotenv |

---

## Environment Variables

### Dashboard (main.py)
- `PORT` - Server port (default: 8000)
- `LAN_ONLY_MODE` - Restrict to LAN (default: true)
- `DATA_LOG_INTERVAL` - Metric logging interval in seconds (default: 60)
- `RENDER` - Auto-detected on Render platform
- `ENVIRONMENT` - Set to `production` for cloud deployment

### Starter (app.main:app)
- `APP_NAME` - Application name
- `APP_VERSION` - Semantic version

---

## Deployment Checklist

### Local Development
- [x] Root `/main.py` (Dashboard) working
- [x] BTC routers wired (btc_price_api + btc_price_api_24h)
- [x] `/analytics` endpoint serving historical-charts.js
- [x] `app/main.py` (Starter) as clean template

### Cloud Deployment (Render)
- [x] render.yaml configured
- [x] requirements.txt complete
- [x] Environment variables set
- [x] PORT binding to 0.0.0.0

### Cloudflare Tunnel
- [x] Tunnel ID: `0fa91577-f370-4fc9-a54a-afe728d6ceba`
- [x] Domains: btcminergpt.ai, www.btcminergpt.ai, web.btcminergpt.ai
- [x] Backend: http://localhost:8000

---

## No Duplication

✅ **Single main.py per app:**
- `/main.py` = Dashboard (production)
- `/app/main.py` = Starter template (reference)

Never run both simultaneously on same port. Use different ports or deploy separately.
