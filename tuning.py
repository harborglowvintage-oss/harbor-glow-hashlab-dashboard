"""
Auto-tuning helper utilities for miner recommendations.

The logic intentionally mirrors the lightweight rules shared in the
specification so GPT/Claude agents can consume the exact same schema.
"""
from __future__ import annotations

from typing import Any, Dict, List

TEMP_HOT_C = 75
TEMP_COOL_C = 60
EFF_POOR = 35  # W/TH
EFF_GREAT = 25  # W/TH


def _coerce_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def generate_tuning_recommendation(miner: Dict[str, Any]) -> Dict[str, Any]:
    """
    Auto-tuning logic based on miner temperature and efficiency.
    Compatible with GPT-style JSON inputs.
    """
    temp = _coerce_float(miner.get("temp_c"))
    efficiency = _coerce_float(miner.get("efficiency_w_th"))
    hashrate = _coerce_float(miner.get("hashrate_ths"))

    recommendations: List[str] = []

    # Temperature heuristics
    if temp > TEMP_HOT_C:
        recommendations.append("Reduce voltage by 2V to avoid overheating")
    elif 0 < temp < TEMP_COOL_C:
        recommendations.append("Consider increasing frequency by 50MHz for more output")

    # Efficiency heuristics
    if efficiency > 0:
        if efficiency > EFF_POOR:
            recommendations.append("Lower frequency by 100MHz to improve efficiency")
        elif efficiency < EFF_GREAT:
            recommendations.append("Optimal efficiency. Maintain settings.")

    return {
        "miner_id": miner.get("miner_id"),
        "model": miner.get("model"),
        "hashrate_ths": hashrate,
        "temp_c": temp,
        "efficiency_w_th": efficiency,
        "recommendation": "; ".join(recommendations) if recommendations else "No change needed"
    }


def auto_tune_miners(miners: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Processes a list of miner stats and returns tuning recommendations."""
    return [generate_tuning_recommendation(miner) for miner in miners]


def stats_to_tuning_payload(stats: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalizes /miner-data style stats into the JSON structure that the tuning
    engine expects (miner_id/model/hashrate/temp/efficiency).
    """
    payload: List[Dict[str, Any]] = []
    for miner in stats.values():
        if not miner:
            continue
        miner_id = miner.get("name") or miner.get("miner_id")
        model = miner.get("model") or miner.get("type") or "unknown"
        hashrate = (
            _coerce_float(miner.get("hashrate_ths"))
            or _coerce_float(miner.get("hashrate_1m"))
        )
        temp_c = (
            _coerce_float(miner.get("temp_c"))
            or _coerce_float(miner.get("temp"))
        )
        efficiency = _coerce_float(miner.get("efficiency"))
        if not efficiency:
            power = _coerce_float(miner.get("power"))
            efficiency = (power / hashrate) if hashrate else 0

        payload.append({
            "miner_id": miner_id,
            "model": model,
            "hashrate_ths": hashrate,
            "temp_c": temp_c,
            "efficiency_w_th": efficiency
        })
    return payload
