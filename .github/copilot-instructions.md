# Copilot Instructions for Harbor Glow HashLab Dashboard

## Project Overview

This is a FastAPI-based cryptocurrency mining dashboard with real-time monitoring and analytics. The repository contains two separate applications:

1. **Harbor Glow HashLab Dashboard** (Production) - Root-level application at `/main.py`
2. **FastAPI Starter Template** - Template application in `/app/main.py`

## Tech Stack

- **Framework**: FastAPI
- **Server**: uvicorn 0.30.x (pinned - do NOT upgrade to 0.38.x due to binding regression)
- **Templating**: Jinja2
- **Testing**: pytest with httpx AsyncClient
- **Python Version**: Python 3
- **Deployment**: Render.com

## Key Architecture Points

### Two Entry Points
- **Production Dashboard**: `uvicorn main:app --host 127.0.0.1 --port 8000`
- **Starter Template**: `uvicorn app.main:app --reload`

Never run both simultaneously on the same port.

### Security Features
- **LAN-only mode**: By default, restricts access to local networks
- **Authentication**: Uses `auth_config.json` for credentials
- **Default credentials**: admin/changeme123 (must be changed for production)

### Important Environment Variables
- `LAN_ONLY_MODE` (default: true) - Set to false for cloud deployment
- `DATA_LOG_INTERVAL` (default: 60) - Metrics logging interval in seconds
- `AI_HISTORY_LIMIT` (default: 288) - Historical data limit for AI analysis
- `CLAUDE_API_KEY` - Optional, enables Claude AI Performance Insights widget
- `PORT` - Server port (default: 8000)

## Development Guidelines

### Dependencies
- Always run `pip install -r requirements.txt` to sync dependencies
- **CRITICAL**: Keep uvicorn pinned to 0.30.x - version 0.38.x has binding issues in constrained environments
- Use virtual environment: `python3 -m venv .venv && source .venv/bin/activate`

### Testing
- Use pytest for all tests: `pytest tests/ -v`
- Tests use httpx AsyncClient for async endpoint testing
- Mark async tests with `@pytest.mark.anyio`
- Example pattern from `tests/test_main.py`:
  ```python
  @pytest.mark.anyio
  async def test_endpoint():
      async with AsyncClient(app=app, base_url="http://testserver") as client:
          response = await client.get("/endpoint")
      assert response.status_code == 200
  ```

### Code Style
- Follow existing patterns in the codebase
- Use type hints where appropriate
- Keep middleware and routing patterns consistent
- Environment variables should use `_env_flag()` helper for boolean flags

### File Organization
- **Main dashboard**: `/main.py`, `/miner_api.py`, `/data_logger.py`
- **Templates**: `/templates/` (production), `/app/templates/` (starter)
- **Static assets**: `/static/` (production), `/app/static/` (starter)
- **Configuration**: `auth_config.json`, `miners_config.json`
- **BTC price tracking**: `/btcrealtimetracker/` module
- **Tests**: `/tests/` directory

### Features to Preserve
- Real-time miner monitoring
- Power cost calculations
- Historical analytics at `/analytics`
- AI-assisted troubleshooting
- Auto-tuning recommendations at `/tuning/recommendations` (GET and POST)
- BTC price tracking widgets
- Cyberpunk-themed responsive UI

### Deployment Considerations
- **Render.com**: Build with `pip install -r requirements.txt`, start with `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Local development**: Use `./start.sh` script which handles virtualenv and PYTHONPATH
- **Cloudflare Tunnel**: Configured for btcminergpt.ai domains
- Always bind to `0.0.0.0` in cloud environments, `127.0.0.1` for local development

### Security
- Never commit API keys or secrets to version control
- Change default credentials before production deployment
- Review LAN_ONLY_MODE setting for cloud deployments
- Use environment variables for sensitive configuration

### Common Patterns
- Static file serving uses FastAPI's StaticFiles
- Templates use Jinja2Templates with context dictionaries
- API routes return JSON responses or use response_model with Pydantic
- Middleware uses Starlette's BaseHTTPMiddleware
- IP validation uses Python's ipaddress module for LAN restrictions

### API Endpoints to Note
- `/health` - Health check endpoint
- `/tuning/recommendations` - GET/POST for miner tuning suggestions
- `/analytics` - Historical charts and analytics
- `/login`, `/logout` - Authentication endpoints
- BTC price APIs in `/btcrealtimetracker/` module

## When Making Changes

1. **Before modifying uvicorn**: Check if version pinning is still required
2. **Before adding dependencies**: Update requirements.txt and verify compatibility
3. **Before changing auth**: Consider security implications
4. **Before modifying LAN middleware**: Test both local and cloud deployment scenarios
5. **When adding routes**: Follow the APIRouter pattern in `/app/routes.py`
6. **When adding features**: Add corresponding tests in `/tests/`

## Documentation References
- Main README: `/README.md`
- Structure guide: `/STRUCTURE.md`
- Quick start: `/QUICK_START.md`
- Deployment readiness: `/DEPLOYMENT_READINESS.md`
