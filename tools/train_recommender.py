"""Lightweight placeholder to inspect miner_metrics CSV.

Usage:
    python tools/train_recommender.py --head 100

This does not run in production; use it offline to explore the
logged dataset before kicking off heavier training jobs.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from statistics import mean

DATA_FILE = Path('data_logs/miner_metrics.csv')


def preview(rows: int) -> None:
    if not DATA_FILE.exists():
        print('No data yet. Let the dashboard run to accumulate metrics.')
        return

    with DATA_FILE.open() as f:
        reader = csv.DictReader(f)
        data = list(reader)

    rows = min(rows, len(data))
    sample = data[-rows:]
    print(f'Previewing last {rows} rows (total stored: {len(data)}):')
    for row in sample:
        print(row)

    for field in ('hashrate_1m', 'hashrate_24h', 'efficiency', 'power'):
        try:
            values = [float(r[field]) for r in data if r.get(field)]
        except ValueError:
            continue
        if values:
            print(f'Avg {field}: {mean(values):.4f}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Inspect miner metrics dataset.')
    parser.add_argument('--head', type=int, default=25, help='How many recent rows to print')
    args = parser.parse_args()
    preview(args.head)
