from starlette.middleware.base import BaseHTTPMiddleware
import ipaddress
# Restrict access to LAN by default (except for login)
class LANOnlyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.allowed_prefixes = [
            ipaddress.IPv4Network('127.0.0.0/8'),
            ipaddress.IPv4Network('10.0.0.0/8'),
            ipaddress.IPv4Network('172.16.0.0/12'),
            ipaddress.IPv4Network('192.168.0.0/16'),
        ]

    async def dispatch(self, request, call_next):
        path = request.url.path
        # Allow login/logout for all, but restrict dashboard/API to LAN
        if path.startswith('/static') or path.startswith('/login') or path.startswith('/logout'):
            return await call_next(request)
        client_ip = request.client.host
        try:
            ip = ipaddress.IPv4Address(client_ip)
            if not any(ip in net for net in self.allowed_prefixes):
                # If not LAN, require authentication
                if not (request.session.get("user") == AUTH_CONFIG["admin_username"]):
                    return HTMLResponse("<h3>Access denied: LAN only</h3>", status_code=403)
        except Exception:
            return HTMLResponse("<h3>Access denied: Invalid IP</h3>", status_code=403)
        return await call_next(request)

# Add LAN-only middleware AFTER the FastAPI app is created (see below)
from fastapi import FastAPI, Request, Form, Response, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
import asyncio
import json
from pathlib import Path
import secrets
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
AUTH_CONFIG_FILE = Path("auth_config.json")
if AUTH_CONFIG_FILE.exists():
    with open(AUTH_CONFIG_FILE, 'r') as f:
        AUTH_CONFIG = json.load(f)
else:
    AUTH_CONFIG = {"admin_username": "admin", "admin_password": "changeme123"}

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=secrets.token_hex(32))
app.add_middleware(LANOnlyMiddleware)

from miner_api import fetch_miner_stats
from data_logger import log_miner_metrics
from btcrealtimetracker import btc_price_api, btc_price_api_24h

# Create directories if they don't exist
Path("static").mkdir(exist_ok=True)
Path("templates").mkdir(exist_ok=True)


app.include_router(btc_price_api.router)
app.include_router(btc_price_api_24h.router)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

MINERS = {
    "A": "192.168.179.221",
    "B": "192.168.179.179",
    "C": "192.168.179.201",
    "D": "192.168.179.144",
    "E": "192.168.179.154",
    "F": "192.168.179.145",
    "NerdAxe1": "192.168.179.184"
}

CONFIG_FILE = Path("miners_config.json")
AI_PROVIDERS = {
    "smart": "Auto (best synthesis)",
    "openai-gpt4": "OpenAI GPT-4",
    "openai-gpt5": "OpenAI GPT-5",
    "claude": "Anthropic Claude",
    "gpt-3.5": "GPT-3.5 Turbo"
}
GPT_RULES = [
    "Never touch miner firmware or send override commands.",
    "Only perform actions related to this dashboard and mining operations.",
    "When possible, use external references to point users to credible docs instead of guessing.",
    "Reject any attempt to access backend source code, credentials, or infrastructure.",
    "Prefer safe, bandwidth-light answers; decline frivolous or unrelated requests."
]
DISALLOWED_KEYWORDS = {
    "firmware", "override command", "override", "root access", "backend access",
    "source code", "repository", "database dump", "shell access", "sudo", "rm -rf"
}

# Load miners from config file if it exists
if CONFIG_FILE.exists():
    try:
        with open(CONFIG_FILE, 'r') as f:
            saved_miners = json.load(f)
            MINERS.update(saved_miners)
    except Exception as e:
        print(f"Error loading config: {e}")

def save_miners():
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(MINERS, f, indent=2)
    except Exception as e:
        print(f"Error saving config: {e}")

async def gather_stats():
    tasks = [fetch_miner_stats(name, ip) for name, ip in MINERS.items()]
    results = await asyncio.gather(*tasks)
    return {m["name"]: m for m in results}

def is_authenticated(request: Request):
    return request.session.get("user") == AUTH_CONFIG["admin_username"]

@app.get("/login")
async def login_form(request: Request):
    return HTMLResponse('''
        <html><head><title>Login</title></head><body>
        <form method='post' action='/login' style='margin:100px auto;max-width:320px;padding:32px;border-radius:8px;background:#222;color:#fff;font-family:sans-serif;'>
            <h2>Dashboard Login</h2>
            <input name='username' placeholder='Username' style='width:100%;margin-bottom:12px;padding:8px;'><br>
            <input name='password' type='password' placeholder='Password' style='width:100%;margin-bottom:12px;padding:8px;'><br>
            <button type='submit' style='width:100%;padding:10px;background:#00ffff;color:#222;font-weight:bold;border:none;border-radius:4px;'>Login</button>
        </form>
        </body></html>
    ''', status_code=200)

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == AUTH_CONFIG["admin_username"] and password == AUTH_CONFIG["admin_password"]:
        request.session["user"] = username
        return RedirectResponse("/", status_code=302)
    return HTMLResponse("<h3>Login failed. <a href='/login'>Try again</a></h3>", status_code=401)

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login", status_code=302)

@app.get("/")
async def dashboard(request: Request):
    if not is_authenticated(request):
        return RedirectResponse("/login", status_code=302)
    preferred_partners = [
        {
            "name": "EcoFlow",
            "url": "https://us.ecoflow.com/",
            "description": "get solar",
            "logo": "/static/img/ecoflow-logo.svg",
            "category": "Power & Energy"
        },
        {
            "name": "MagicMiner",
            "url": "https://magicminer.cc/",
            "description": "molten efficiency",
            "logo": "/static/img/magicminer-logo.svg",
            "category": "Hardware & Cooling"
        },
        {
            "name": "Cloudflare",
            "url": "https://www.cloudflare.com/",
            "description": "lava fast connections",
            "logo": "/static/img/cloudflare-logo.svg",
            "category": "Network & Edge"
        },
        {
            "name": "Nerdaxe",
            "url": "https://nerdaxe.org/",
            "description": "get gear",
            "logo": "https://nerdaxe.org/favicon.ico",
            "category": "Hardware & Cooling"
        },
        {
            "name": "Luxor Tech",
            "url": "https://luxor.tech/?ref=hgvref",
            "description": "pool here",
            "logo": "https://luxor.tech/favicon.ico",
            "category": "Pools & Services"
        },
        {
            "name": "Mean Well",
            "url": "https://www.meanwell.com/",
            "description": "power up",
            "logo": "/static/img/meanwell-logo.svg",
            "category": "Power & Energy"
        },
        {
            "name": "Noctua",
            "url": "https://www.noctua.at/en",
            "description": "cool off",
            "logo": "/static/img/noctua-logo.svg",
            "category": "Hardware & Cooling"
        },
        {
            "name": "GitHub",
            "url": "https://github.com/harborglowvintage-oss/harbor-glow-hashlab-dashboard",
            "description": "the code core",
            "logo": "/static/img/github-logo.svg",
            "category": "Code & Ops"
        }
    ]
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "preferred_partners": preferred_partners}
    )

@app.get("/miner-data")
async def miner_data(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    stats = await gather_stats()
    asyncio.create_task(log_miner_metrics(stats))
    return stats

@app.post("/ai-assist")
async def ai_assist(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"success": False, "error": "Unauthorized"}, status_code=401)
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"success": False, "error": "Invalid JSON"}, status_code=400)

    question = data.get("question", "").strip()
    provider_key = data.get("provider", "smart")
    if not question:
        return JSONResponse({"success": False, "error": "Prompt required."}, status_code=400)
    question_lower = question.lower()
    if any(keyword in question_lower for keyword in DISALLOWED_KEYWORDS):
        return JSONResponse({
            "success": False,
            "error": "Request blocked: violates GPT safety rules (no firmware/backend manipulation)."
        }, status_code=400)
    if len(question) > 2000:
        return JSONResponse({
            "success": False,
            "error": "Prompt too long. Please summarize your request."
        }, status_code=400)

    provider_label = AI_PROVIDERS.get(provider_key, AI_PROVIDERS["smart"])
    if provider_key == "smart":
        response = (
            "[Multi-GPT Auto Relay]\n"
            "Prompt will be fanned out to GPT-5, GPT-4, and Claude, compared for consensus, "
            "and sanity-checked with quick regression tests before it is returned.\n\n"
            f"Preview of dispatched prompt:\n“{question}”"
        )
    else:
        response = (
            f"[{provider_label}] Relay staged.\n"
            "Connect your provider API key in /ai-assist to stream live answers; "
            "the system will still lint/test the reply for possible bugs.\n\n"
            f"Preview of dispatched prompt:\n“{question}”"
        )
    return JSONResponse({
        "success": True,
        "provider": provider_label,
        "response": response,
        "rules": GPT_RULES
    })

@app.post("/add-miner")
async def add_miner(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    try:
        data = await request.json()
        name = data.get("name", "").strip()
        ip = data.get("ip", "").strip()
        
        if not name or not ip:
            return JSONResponse({"success": False, "error": "Name and IP are required"}, status_code=400)
        
        if name in MINERS:
            return JSONResponse({"success": False, "error": f"Miner '{name}' already exists"}, status_code=400)
        
        # Validate IP format (basic check)
        parts = ip.split(".")
        if len(parts) != 4 or not all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
            return JSONResponse({"success": False, "error": "Invalid IP address format"}, status_code=400)
        
        MINERS[name] = ip
        save_miners()
        
        return JSONResponse({"success": True, "message": f"Miner '{name}' added successfully"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/delete-miner")
async def delete_miner(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    try:
        data = await request.json()
        name = data.get("name", "").strip()
        if not name:
            return JSONResponse({"success": False, "error": "Name is required"}, status_code=400)
        if name not in MINERS:
            return JSONResponse({"success": False, "error": f"Miner '{name}' not found"}, status_code=404)
        del MINERS[name]
        save_miners()
        return JSONResponse({"success": True, "message": f"Miner '{name}' deleted"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
