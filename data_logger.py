import asyncio
import csv
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

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


def _cast_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'timestamp': row.get('timestamp'),
        'name': row.get('name'),
        'hashrate_1m': float(row.get('hashrate_1m', 0) or 0),
        'hashrate_24h': float(row.get('hashrate_24h', 0) or 0),
        'power': float(row.get('power', 0) or 0),
        'efficiency': float(row.get('efficiency', 0) or 0),
        'temp': float(row.get('temp', 0) or 0),
        'chipTemp': float(row.get('chipTemp', 0) or 0),
        'sharesAccepted': int(row.get('sharesAccepted', 0) or 0),
        'sharesRejected': int(row.get('sharesRejected', 0) or 0),
        'alive': str(row.get('alive', '')).lower() in {'true', '1', 'yes'}
    }


def load_recent_metrics(limit: int = 288) -> List[Dict[str, Any]]:
    """
    Return the most recent miner metric rows for analytics/AI. Default keeps
    roughly 24h of data if logging every 5 minutes (288 samples).
    """
    if limit <= 0 or not DATA_FILE.exists():
        return []
    buffer: deque = deque(maxlen=limit)
    with DATA_FILE.open('r', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            buffer.append(_cast_row(row))
    return list(buffer)
