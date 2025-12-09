import asyncio
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

DATA_DIR = Path('data_logs')
DATA_FILE = DATA_DIR / 'miner_metrics.csv'
FIELDNAMES = [
    'timestamp',
    'name',
    'hashrate_1m',
    'hashrate_24h',
    'power',
    'efficiency',
    'temp',
    'chipTemp',
    'sharesAccepted',
    'sharesRejected',
    'alive'
]

_lock = asyncio.Lock()

def _write_rows(miner_stats: Dict[str, Dict[str, Any]]):
    DATA_DIR.mkdir(exist_ok=True)
    file_exists = DATA_FILE.exists()
    timestamp = datetime.now(timezone.utc).isoformat()
    rows = []
    for name, payload in miner_stats.items():
        rows.append({
            'timestamp': timestamp,
            'name': name,
            'hashrate_1m': round(payload.get('hashrate_1m', 0), 5),
            'hashrate_24h': round(payload.get('hashrate_24h', 0), 5),
            'power': payload.get('power', 0),
            'efficiency': round(payload.get('efficiency', 0), 5),
            'temp': payload.get('temp', 0),
            'chipTemp': payload.get('chipTemp', 0),
            'sharesAccepted': payload.get('sharesAccepted', 0),
            'sharesRejected': payload.get('sharesRejected', 0),
            'alive': bool(payload.get('alive', False))
        })
    with DATA_FILE.open('a', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, FIELDNAMES)
        if not file_exists:
            writer.writeheader()
        writer.writerows(rows)

async def log_miner_metrics(miner_stats: Dict[str, Dict[str, Any]]):
    if not miner_stats:
        return
    async with _lock:
        await asyncio.to_thread(_write_rows, miner_stats)
