import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.anyio
async def test_root_returns_html():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        response = await client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "FastAPI" in response.text
