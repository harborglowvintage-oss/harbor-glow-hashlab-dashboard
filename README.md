# Harbor Glow HashLab Dashboard

A FastAPI-based cryptocurrency mining dashboard with real-time monitoring and analytics.

## Render Deployment

This application is configured for easy deployment on Render.

### Quick Deploy

1. Fork this repository to your GitHub account
2. Connect your GitHub account to Render
3. Create a new Web Service from your forked repository
4. Use these settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Environment Variables

Set these environment variables in your Render service:

- `LAN_ONLY_MODE=false` - Disable LAN restrictions for cloud deployment
- `DATA_LOG_INTERVAL=60` - Metrics logging interval (seconds)
- `AI_HISTORY_LIMIT=288` - Historical data limit for AI analysis

### Default Credentials

- **Username**: admin
- **Password**: changeme123

⚠️ **Security Note**: Change the default password in `auth_config.json` before deploying to production.

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Features

- Real-time miner monitoring
- Power cost calculations
- Historical analytics
- AI-assisted troubleshooting
- Partner recommendations
- Responsive cyberpunk UI
