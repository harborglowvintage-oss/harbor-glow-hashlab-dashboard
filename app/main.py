"""Starter FastAPI Application.

This is a template for a simple FastAPI app with:
- Static file serving
- Jinja2 HTML templating
- JSON API endpoints
- Environment-based configuration

To run:
    uvicorn app.main:app --reload

Or from project root:
    python -m uvicorn app.main:app --reload
"""

from pathlib import Path
import sys
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Handle imports from both 'python -m uvicorn app.main:app' and 'from app.main import app'
try:
    from .models import settings
    from .routes import router
except ImportError:
    from models import settings
    from routes import router

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

STATIC_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A simple FastAPI starter template"
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Include routers
app.include_router(router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}
