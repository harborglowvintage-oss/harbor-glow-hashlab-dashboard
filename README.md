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
- `CLAUDE_API_KEY=` - Enables the Claude AI Performance Insights widget (`/analytics/claude`)
- `CLAUDE_MODEL=claude-3-5-sonnet-20241022` (optional override)

### Default Credentials

- **Username**: admin
- **Password**: changeme123

⚠️ **Security Note**: Change the default password in `auth_config.json` before deploying to production.

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

> Note: keep your virtualenv synced with `pip install -r requirements.txt --upgrade`. The server stack is pinned to uvicorn 0.30.x because 0.38.x currently fails to bind to any interface inside constrained environments.

## Features

- Real-time miner monitoring
- Power cost calculations
- Historical analytics
- AI-assisted troubleshooting
- Partner recommendations
- Responsive cyberpunk UI

### Auto-tuning Recommendations

The dashboard now exposes GPT-friendly tuning help at `/tuning/recommendations`.

- `GET /tuning/recommendations` pulls live miner stats and returns suggestions based on temperature and efficiency.
- `POST /tuning/recommendations` accepts a JSON list (or `{"miners": [...]}`) that follows:

```json
[
  {"miner_id":"A","model":"S19j Pro","hashrate_ths":100,"temp_c":70,"efficiency_w_th":30}
]
```

Both routes respond with the same schema as the example above, making it easy to hand off results to GPT/Claude agents or UI widgets.
