from starlette.middleware.base import BaseHTTPMiddleware
import ipaddress
import os
import re
import logging
from typing import List, Dict, Any, Optional
from collections import defaultdict
from contextlib import suppress


def _env_flag(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "off", "no"}


def _extra_networks_from_env() -> List[ipaddress.IPv4Network]:
    extra_networks = []
    cidr_blob = os.getenv("LAN_EXTRA_CIDRS", "")
    for cidr in cidr_blob.split(","):
        cidr = cidr.strip()
        if not cidr:
            continue
        try:
            extra_networks.append(ipaddress.IPv4Network(cidr))
        except ValueError:
            logging.warning("Ignoring invalid CIDR in LAN_EXTRA_CIDRS: %s", cidr)
    return extra_networks


# Restrict access to LAN by default (except for login)
class LANOnlyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        base_prefixes = [
            ipaddress.IPv4Network('127.0.0.0/8'),
            ipaddress.IPv4Network('10.0.0.0/8'),
            ipaddress.IPv4Network('172.16.0.0/12'),
            ipaddress.IPv4Network('192.168.0.0/16'),
        ]
        self.allowed_prefixes = base_prefixes + _extra_networks_from_env()
        self.lan_enforcement_enabled = _env_flag("LAN_ONLY_MODE", True)

    async def dispatch(self, request, call_next):
        if not self.lan_enforcement_enabled:
            return await call_next(request)
        path = request.url.path
        # Allow login/logout for all, but restrict dashboard/API to LAN
        if path.startswith('/static') or path.startswith('/login') or path.startswith('/logout'):
            return await call_next(request)
        # In cloud environments, skip IP validation
        if os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production":
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
from fastapi import FastAPI, Request, Form, Response, status, Depends, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
import asyncio
import json
from pathlib import Path
import secrets
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from tuning import auto_tune_miners, stats_to_tuning_payload
AUTH_CONFIG_FILE = Path("auth_config.json")
if AUTH_CONFIG_FILE.exists():
    with open(AUTH_CONFIG_FILE, 'r') as f:
        AUTH_CONFIG = json.load(f)
else:
    AUTH_CONFIG = {"admin_username": "admin", "admin_password": "changeme123"}

logger = logging.getLogger("hashlab")

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=secrets.token_hex(32))
app.add_middleware(LANOnlyMiddleware)

from miner_api import fetch_miner_stats
from data_logger import log_miner_metrics, load_recent_metrics
from btcrealtimetracker import btc_price_api, btc_price_api_24h

# Create directories if they don't exist
Path("static").mkdir(exist_ok=True)
Path("templates").mkdir(exist_ok=True)


app.include_router(btc_price_api.router)
app.include_router(btc_price_api_24h.router)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

hostname_label_re = re.compile(r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$")


def is_valid_hostname(value: str) -> bool:
    if len(value) > 253:
        return False
    labels = value.split(".")
    return all(hostname_label_re.fullmatch(label) for label in labels)


def is_valid_ipv4(value: str) -> bool:
    try:
        ipaddress.IPv4Address(value)
        return True
    except ipaddress.AddressValueError:
        return False


MINERS = {
    "A": "192.168.179.221",
    "B": "192.168.179.178",
    "C": "192.168.179.201",
    "D": "192.168.179.144",
    "E": "192.168.179.154",
    "F": "192.168.179.143",
    "G": "192.168.179.185",
    "H-nerd": "192.168.179.218",
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
DATA_LOG_INTERVAL = int(os.getenv("DATA_LOG_INTERVAL", "60"))
AI_HISTORY_LIMIT = int(os.getenv("AI_HISTORY_LIMIT", "288"))
TEMP_ALERT_THRESHOLD = float(os.getenv("AI_TEMP_THRESHOLD", "78"))
EFFICIENCY_ALERT_THRESHOLD = float(os.getenv("AI_EFFICIENCY_THRESHOLD", "42"))
SHARE_REJECT_ALERT = float(os.getenv("AI_REJECT_THRESHOLD", "2"))
ALLOWED_JSON_TASKS = [
    {
        "id": "fleet-overview",
        "title": "Summarize fleet status",
        "description": "Parse the /miner-data JSON payload and surface per-miner hashrate, temperatures, fan speeds, and alive flags.",
        "json_scope": "/miner-data",
        "keywords": {"summary", "status", "overview", "hashrate", "fleet"}
    },
    {
        "id": "thermal-watch",
        "title": "Flag thermal hotspots",
        "description": "Scan JSON temperature fields for miners above your warning threshold and report the worst offenders.",
        "json_scope": "/miner-data -> temps",
        "keywords": {"temp", "heat", "thermal", "overheat", "fan"}
    },
    {
        "id": "efficiency-check",
        "title": "Compare efficiency and power draw",
        "description": "Calculate basic efficiency metrics from wattage / hashrate values in the miner JSON to highlight underperformers.",
        "json_scope": "/miner-data -> watts/hashrate",
        "keywords": {"efficiency", "power", "watt", "kw", "kwh"}
    },
    {
        "id": "share-health",
        "title": "Review share + error counters",
        "description": "List miners with stale share spikes or error counts using the share/error arrays in the JSON.",
        "json_scope": "/miner-data -> shares",
        "keywords": {"share", "reject", "error", "pool"}
    },
    {
        "id": "export-snapshot",
        "title": "Provide JSON snapshot for download",
        "description": "Bundle the last /miner-data response (and optional BTC price JSON) so you can export or archive it.",
        "json_scope": "/miner-data + /btc-price-24h",
        "keywords": {"export", "json", "download", "save", "log"}
    },
]


def select_json_tasks(prompt: str):
    prompt_lower = prompt.lower()
    matched = []
    for task in ALLOWED_JSON_TASKS:
        if any(keyword in prompt_lower for keyword in task["keywords"]):
            matched.append(task)
    return matched or ALLOWED_JSON_TASKS


def _stats_list(stats: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    return list(stats.values())


def _sanitize_miner(miner: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in miner.items() if k != "ip"}


def _fmt_ths(value: float) -> str:
    return f"{value:.2f} TH/s"


def _fmt_watt(value: float) -> str:
    return f"{value:.0f} W"


def _fmt_temp(value: float) -> str:
    return f"{value:.1f} °C"


def summarize_history(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not rows:
        return {"samples": 0}
    total_by_ts: Dict[str, float] = defaultdict(float)
    temps_by_ts: Dict[str, List[float]] = defaultdict(list)
    hottest = None
    for row in rows:
        ts = row.get("timestamp")
        total_by_ts[ts] += row.get("hashrate_1m", 0) or 0
        temp_val = row.get("temp", 0) or 0
        if temp_val:
            temps_by_ts[ts].append(temp_val)
        if not hottest or temp_val > hottest["temp"]:
            hottest = {"name": row.get("name"), "temp": temp_val, "timestamp": ts}
    ordered_ts = sorted(total_by_ts.keys())
    total_series = [total_by_ts[ts] for ts in ordered_ts]
    avg_temp_series = [
        (sum(temps_by_ts[ts]) / len(temps_by_ts[ts])) if temps_by_ts[ts] else 0
        for ts in ordered_ts
    ]
    fleet_avg_hash = sum(total_series) / len(total_series) if total_series else 0
    trend = "stable"
    if len(total_series) >= 2:
        first, last = total_series[0], total_series[-1]
        if last > first * 1.05:
            trend = "rising"
        elif last < first * 0.95:
            trend = "slipping"
    return {
        "samples": len(rows),
        "timestamps": ordered_ts,
        "total_hash_series": total_series,
        "avg_temp_series": avg_temp_series,
        "fleet_avg_hash": fleet_avg_hash,
        "fleet_hash_trend": trend,
        "hottest": hottest,
        "latest_timestamp": rows[-1].get("timestamp")
    }


def analyze_fleet_overview(
    stats: Dict[str, Dict[str, Any]],
    history_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    miners = _stats_list(stats)
    if not miners:
        return {
            "summary": "No miner telemetry yet. Refresh once miners report into /miner-data.",
            "recommendations": ["Confirm rigs are online and reachable over the LAN."],
            "data": []
        }
    online = [m for m in miners if m.get("alive")]
    offline = [m for m in miners if not m.get("alive")]
    total_hash = sum(m.get("hashrate_1m", 0) for m in online)
    temps = [m.get("temp", 0) for m in online if m.get("temp")]
    avg_temp = sum(temps) / len(temps) if temps else None
    avg_per_miner = total_hash / len(online) if online else 0
    
    # Enhanced summary with key observations
    summary_lines = [
        f"🎯 Fleet Status: {len(online)}/{len(miners)} miners online",
        f"⚡ Total Hashrate: {_fmt_ths(total_hash)}",
        f"📊 Average per miner: {_fmt_ths(avg_per_miner)}",
    ]
    
    # Analyze historical trend
    observations = []
    if history_summary and history_summary.get("total_hash_series"):
        series = history_summary["total_hash_series"]
        if len(series) >= 3:
            peak = max(series)
            current = series[-1]
            avg_historical = history_summary.get("fleet_avg_hash", 0)
            trend = history_summary.get("fleet_hash_trend", "stable")
            
            observations.append(f"📈 Historical Trend: {trend.upper()}")
            observations.append(f"   - Peak performance: {_fmt_ths(peak)}")
            observations.append(f"   - Current: {_fmt_ths(current)}")
            observations.append(f"   - Average: {_fmt_ths(avg_historical)}")
            
            # Detect volatility
            if len(series) >= 5:
                recent = series[-5:]
                volatility = max(recent) - min(recent)
                if volatility > avg_historical * 0.1:
                    observations.append(f"   ⚠️ High volatility detected: {_fmt_ths(volatility)} range")
            
            # Detect recent decline
            if len(series) >= 3:
                recent_avg = sum(series[-3:]) / 3
                if recent_avg < avg_historical * 0.95:
                    observations.append(f"   📉 Recent decline: dropping below average")
    
    recs = []
    
    # Check for offline miners
    if offline:
        recs.append(f"🔴 {len(offline)} miners offline: {', '.join(m['name'] for m in offline)}")
        recs.append("   → Check power, network connections, and restart if needed")
    
    # Check for underperforming miners
    underperforming = [m for m in online if m.get("hashrate_1m", 0) < 7.0]
    if underperforming:
        recs.append(f"⚠️ {len(underperforming)} miners underperforming (<7 TH/s):")
        for m in underperforming[:3]:
            recs.append(f"   - {m['name']}: {_fmt_ths(m.get('hashrate_1m', 0))}")
        recs.append("   → Check for throttling, cooling, or hardware issues")
    
    # Temperature monitoring
    if avg_temp:
        if avg_temp > TEMP_ALERT_THRESHOLD:
            recs.append(f"🌡️ High temps: Average {avg_temp:.1f}°C (threshold: {TEMP_ALERT_THRESHOLD}°C)")
            recs.append("   → Improve ventilation, check fans, reduce ambient temperature")
        elif avg_temp > (TEMP_ALERT_THRESHOLD - 5):
            recs.append(f"🌡️ Temps approaching threshold: {avg_temp:.1f}°C")
            recs.append("   → Monitor closely, prepare cooling improvements")
    
    # Check rejection rates
    high_rejects = [m for m in online if (m.get("sharesRejected", 0) / max(m.get("sharesAccepted", 1), 1)) > 0.02]
    if high_rejects:
        recs.append(f"📡 {len(high_rejects)} miners with high rejection rates (>2%):")
        for m in high_rejects[:3]:
            total = m.get("sharesAccepted", 0) + m.get("sharesRejected", 0)
            rate = (m.get("sharesRejected", 0) / total * 100) if total > 0 else 0
            recs.append(f"   - {m['name']}: {rate:.1f}% rejects")
        recs.append("   → Check network connection, pool settings, or switch pools")
    
    # Positive feedback if everything is good
    if not recs:
        recs.append("✅ Fleet operating within optimal parameters")
        recs.append(f"   - All {len(online)} miners performing above 7 TH/s")
        recs.append(f"   - Temperatures stable at {avg_temp:.1f}°C" if avg_temp else "   - Temperature monitoring active")
        recs.append("   - Rejection rates healthy (<2%)")
    
    summary = "\n".join(summary_lines + [""] + observations)
    data = [_sanitize_miner(m) for m in online]
    return {"summary": summary, "recommendations": recs, "data": data}


def analyze_thermal_watch(
    stats: Dict[str, Dict[str, Any]],
    history_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    miners = _stats_list(stats)
    hot = [m for m in miners if m.get("temp", 0) >= TEMP_ALERT_THRESHOLD]
    hot_sorted = sorted(hot, key=lambda m: m.get("temp", 0), reverse=True)[:3]
    if not hot_sorted:
        summary = f"No miners above {TEMP_ALERT_THRESHOLD:.0f} °C."
        payload = {
            "summary": summary,
            "recommendations": ["Temps look good; keep airflow steady."],
            "data": []
        }
        if history_summary and history_summary.get("hottest"):
            hottest = history_summary["hottest"]
            payload["recommendations"].append(
                f"Historical hotspot: {hottest['name']} at {_fmt_temp(hottest['temp'])}."
            )
        return payload
    recs = [
        f"{m['name']} at {_fmt_temp(m.get('temp', 0))} (fans {m.get('asicTemps', [])[:1] or 'n/a'})"
        for m in hot_sorted
    ]
    summary = f"{len(hot)} miner(s) exceed {TEMP_ALERT_THRESHOLD:.0f} °C. Top hotspots listed."
    data = [_sanitize_miner(m) for m in hot_sorted]
    return {"summary": summary, "recommendations": recs, "data": data}


def analyze_efficiency(
    stats: Dict[str, Dict[str, Any]],
    history_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    miners = _stats_list(stats)
    eligible = [
        m for m in miners
        if m.get("hashrate_1m", 0) > 0 and m.get("power", 0) > 0
    ]
    if not eligible:
        return {
            "summary": "No power/hashrate data to score efficiency yet.",
            "recommendations": ["Wait for miners to report wattage and TH/s metrics."],
            "data": []
        }
    worst = sorted(eligible, key=lambda m: m.get("efficiency", 0), reverse=True)[:3]
    recs = [
        f"{m['name']}: {m.get('efficiency', 0):.1f} W/TH at {_fmt_ths(m.get('hashrate_1m', 0))} ({_fmt_watt(m.get('power', 0))})."
        for m in worst
        if m.get("efficiency", 0) >= EFFICIENCY_ALERT_THRESHOLD
    ]
    if recs:
        summary = (
            "Efficiency ranked by watt per TH. "
            f"{len(recs)} miner(s) exceed {EFFICIENCY_ALERT_THRESHOLD:.0f} W/TH."
        )
    else:
        summary = "All active miners operating below the configured efficiency alert threshold."
        recs = ["No efficiency outliers detected; continue monitoring."]
    if history_summary and history_summary.get("fleet_hash_trend"):
        recs.append(f"Fleet trend: {history_summary['fleet_hash_trend']} based on historical telemetry.")
    data = [_sanitize_miner(m) for m in worst]
    return {"summary": summary, "recommendations": recs, "data": data}


def analyze_share_health(
    stats: Dict[str, Dict[str, Any]],
    history_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    miners = _stats_list(stats)
    flagged = []
    for m in miners:
        accepted = m.get("sharesAccepted", 0)
        rejected = m.get("sharesRejected", 0)
        total = accepted + rejected
        if total == 0:
            continue
        reject_rate = (rejected / total) * 100
        if reject_rate >= SHARE_REJECT_ALERT:
            flagged.append((m, reject_rate, total))
    flagged.sort(key=lambda t: t[1], reverse=True)
    summary = (
        f"{len(flagged)} miner(s) with reject rate ≥ {SHARE_REJECT_ALERT:.1f}%."
        if flagged else "Share reject rates all below alert threshold."
    )
    recs = []
    for m, rate, total in flagged[:3]:
        rejects = m.get("sharesRejected", 0)
        recs.append(f"{m['name']}: {rate:.2f}% rejects ({rejects}/{total} shares).")
    if not recs:
        recs = ["No reject spikes detected; pool connectivity healthy."]
    if history_summary and history_summary.get("samples"):
        recs.append(f"Analyzed {history_summary['samples']} historical data points for baseline.")
    data = [_sanitize_miner(item[0]) for item in flagged[:3]]
    return {"summary": summary, "recommendations": recs, "data": data}


def prepare_export_snapshot(
    stats: Dict[str, Dict[str, Any]],
    history_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    miners = _stats_list(stats)
    sanitized = [_sanitize_miner(m) for m in miners]
    summary = f"Prepared sanitized snapshot for {len(sanitized)} miner(s). Fetch /miner-data for the full JSON."
    recs = [
        "Run: curl -s http://<dashboard>/miner-data > miner_snapshot.json",
        "Optional: include BTC price via /btc-price-24h for combined context."
    ]
    if history_summary and history_summary.get("samples"):
        recs.append(f"{history_summary['samples']} samples available in CSV for statistical exports.")
    sample = sanitized[:3]
    return {"summary": summary, "recommendations": recs, "data": sample}


TASK_HANDLERS = {
    "fleet-overview": analyze_fleet_overview,
    "thermal-watch": analyze_thermal_watch,
    "efficiency-check": analyze_efficiency,
    "share-health": analyze_share_health,
    "export-snapshot": prepare_export_snapshot,
}


async def periodic_metric_logger():
    if DATA_LOG_INTERVAL <= 0:
        logger.warning("DATA_LOG_INTERVAL<=0; periodic logger disabled.")
        return
    logger.info("Starting periodic miner metric logger (interval %ss)", DATA_LOG_INTERVAL)
    try:
        while True:
            try:
                stats = await gather_stats()
                await log_miner_metrics(stats)
            except Exception as exc:
                logger.exception("Periodic metric logger failed: %s", exc)
            await asyncio.sleep(DATA_LOG_INTERVAL)
    except asyncio.CancelledError:
        logger.info("Periodic metric logger cancelled.")
        raise


@app.on_event("startup")
async def startup_event():
    await prune_inactive_miners_on_startup()
    # Only start periodic logger in development, not in production/cloud environments
    if os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production":
        logger.info("Production environment detected - skipping periodic logger")
        return
    if DATA_LOG_INTERVAL <= 0:
        return
    task = asyncio.create_task(periodic_metric_logger())
    app.state.metric_logger_task = task


@app.on_event("shutdown")
async def shutdown_event():
    task = getattr(app.state, "metric_logger_task", None)
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task

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

async def detect_active_miners(miner_map: Dict[str, str]) -> Dict[str, str]:
    """Probe configured miners once and keep only those that respond."""
    items = list(miner_map.items())
    if not items:
        return {}
    tasks = [fetch_miner_stats(name, ip) for name, ip in items]
    results = await asyncio.gather(*tasks)
    active: Dict[str, str] = {}
    for (name, _), payload in zip(items, results):
        if payload.get("alive"):
            active[name] = miner_map[name]
    return active


async def prune_inactive_miners_on_startup():
    if not MINERS:
        return
    active = await detect_active_miners(MINERS)
    inactive = sorted(set(MINERS.keys()) - set(active.keys()))
    if not inactive:
        return
    logger.info(
        "Startup filter: skipping %d inactive miner(s): %s",
        len(inactive),
        ", ".join(inactive)
    )
    MINERS.clear()
    MINERS.update(active)


async def gather_stats():
    items = list(MINERS.items())
    tasks = [fetch_miner_stats(name, ip) for name, ip in items]
    results = await asyncio.gather(*tasks)
    enriched = {}
    for (name, ip), payload in zip(items, results):
        miner_data = dict(payload)
        miner_data["ip"] = ip
        miner_data["dashboard_url"] = f"http://{ip}/"
        enriched[name] = miner_data
    return enriched

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


@app.get("/analytics")
async def analytics_board(request: Request):
    if not is_authenticated(request):
        return RedirectResponse("/login", status_code=302)
    return templates.TemplateResponse("charts.html", {"request": request})

@app.get("/miner-data")
async def miner_data(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    stats = await gather_stats()
    try:
        await log_miner_metrics(stats)
    except Exception as e:
        logger.warning(f"Failed to log metrics: {e}")
    return stats


@app.get("/historical-metrics")
async def historical_metrics(
    request: Request,
    limit: int = Query(288, ge=10, le=2000)
):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    rows = await asyncio.to_thread(load_recent_metrics, limit)
    summary = summarize_history(rows)
    return JSONResponse({
        "success": True,
        "samples": len(rows),
        "limit": limit,
        "data": rows,
        "summary": summary
    })


@app.get("/tuning/recommendations")
async def tuning_recommendations(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    stats = await gather_stats()
    payload = stats_to_tuning_payload(stats)
    recommendations = auto_tune_miners(payload)
    return JSONResponse({
        "success": True,
        "source": "live",
        "count": len(recommendations),
        "data": recommendations
    })


@app.post("/tuning/recommendations")
async def tuning_recommendations_from_payload(request: Request):
    if not is_authenticated(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON payload"}, status_code=400)
    if isinstance(payload, dict):
        miners = payload.get("miners")
    else:
        miners = payload
    if not isinstance(miners, list):
        return JSONResponse({"error": "Expected a list of miner objects or {'miners': [...]}."}, status_code=400)
    recommendations = auto_tune_miners(miners)
    return JSONResponse({
        "success": True,
        "source": "payload",
        "count": len(recommendations),
        "data": recommendations
    })

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
    selected_tasks = select_json_tasks(question)
    stats_snapshot = await gather_stats()
    history_rows = await asyncio.to_thread(load_recent_metrics, AI_HISTORY_LIMIT)
    history_summary = summarize_history(history_rows)
    recommendation_payloads = []
    for idx, task in enumerate(selected_tasks, start=1):
        handler = TASK_HANDLERS.get(task["id"], analyze_fleet_overview)
        analysis = handler(stats_snapshot, history_summary)
        payload = {
            **task,
            "position": idx,
            "summary": analysis.get("summary"),
            "action_items": analysis.get("recommendations", []),
            "data": analysis.get("data", [])
        }
        recommendation_payloads.append(payload)

    response_lines = [
        f"[{provider_label}] JSON telemetry assistant online.",
        "Recommended actions based on the latest /miner-data snapshot:"
    ]
    for payload in recommendation_payloads:
        response_lines.append(f"{payload['position']}. {payload['title']}: {payload['summary']}")
        for action in payload["action_items"] or []:
            response_lines.append(f"   - {action}")
    response_lines.append("Respond with the option number/title to drill deeper or execute that JSON workflow.")
    response = "\n".join(response_lines)
    return JSONResponse({
        "success": True,
        "provider": provider_label,
        "response": response,
        "recommendations": recommendation_payloads,
        "history_meta": history_summary,
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
        if not (is_valid_ipv4(ip) or is_valid_hostname(ip)):
            return JSONResponse(
                {"success": False, "error": "Invalid IP or hostname format"},
                status_code=400
            )
        
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


@app.get("/miner-redirect")
async def miner_redirect(ip: str):
    """
    Redirects to the miner's IP address.
    Helps with some mixed-content scenarios by initiating the navigation from the server side,
    though the browser may still flag the final destination as insecure.
    """
    target = ip
    if not target.startswith("http"):
        target = f"http://{target}/"
    return RedirectResponse(url=target)


# ASGI application for Render deployment
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
