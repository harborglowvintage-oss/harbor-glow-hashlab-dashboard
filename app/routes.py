"""Application route definitions."""
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from .models import Item, ItemResponse, settings

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    context = {
        "request": request,
        "app_name": settings.app_name,
        "welcome_message": settings.welcome_message,
    }
    return templates.TemplateResponse("index.html", context)


@router.get("/api/hello")
async def hello_message():
    return {"message": f"Hello from {settings.app_name}!"}


@router.post("/api/items", response_model=ItemResponse)
async def create_item(item: Item):
    return ItemResponse(
        message=f"Item '{item.name}' accepted.",
        item=item,
    )
