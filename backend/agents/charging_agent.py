import json
from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json
from utils.charging_station_fetcher import fetch_nearby_stations

async def charging_agent(lat: float, lon: float, battery_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    CHARGING INTELLIGENCE AGENT
    Fetches real stations from OpenChargeMap, enriches with simulated data,
    then uses Groq to recommend the best option.
    """
    stations = await fetch_nearby_stations(lat, lon, 25.0, 10)
    top5 = stations[:5]

    if not top5:
        return {
            "recommended_station": None,
            "all_candidates": [],
            "estimated_wait_minutes": 0,
            "estimated_charging_duration_minutes": 0,
            "confidence_score": 0.3,
            "reasoning": "No charging stations found in the area. Try expanding search radius.",
        }

    system_prompt = """You are a Charging Intelligence Agent for an EV operating system.
Given candidate charging stations and battery state, return ONLY a JSON object:
{
  "recommended_station": { "id": number, "name": string, "reason": string },
  "all_candidates": [{ "id": number, "name": string, "score": number, "pros": [string], "cons": [string] }],
  "estimated_wait_minutes": number,
  "estimated_charging_duration_minutes": number,
  "charging_strategy": "fast_charge|slow_charge|opportunity_charge",
  "confidence_score": number (0-1),
  "reasoning": string
}"""

    user_msg = f"""Battery SOC: {battery_state.get("soc")}%, SOH: {battery_state.get("soh")}%
Target charge: 80% (optimal for battery health)
Candidate stations: {json.dumps(top5, indent=2)}
Recommend the best station considering distance, power, availability, and cost."""

    # Rule-based best selection fallback
    best_by_score = top5[0]
    best_score = -float('inf')
    for s in top5:
        score = (30 if s["available_bays"] > 0 else 0) + (s["max_power_kw"] / 10.0) - s["distance_km"] * 2.0 - s["price_per_kwh"] * 10.0
        if score > best_score:
            best_score = score
            best_by_score = s

    v_type = battery_state.get("vehicleType", "car")
    cap_kwh = battery_state.get("capacityKwh", 4.0 if v_type == "bike" else 75.0)
    soc = battery_state.get("soc", 50)
    soh = battery_state.get("soh", 95)
    soc_needed = max(0.0, 80.0 - soc)
    energy_needed_kwh = (soc_needed / 100.0) * cap_kwh * (soh / 100.0)
    max_kw = best_by_score.get("max_power_kw", 50.0)
    charge_duration_min = round((energy_needed_kwh / max_kw) * 60.0) if max_kw else (120 if v_type == "bike" else 45)

    fallback = {
        "recommended_station": {
            "id": best_by_score["id"],
            "name": best_by_score["name"],
            "reason": "Best balance of distance, power, and availability"
        },
        "all_candidates": [{"id": s["id"], "name": s["name"], "score": 0.7, "pros": [], "cons": []} for s in top5],
        "estimated_wait_minutes": best_by_score["queue_length"] * 20,
        "estimated_charging_duration_minutes": charge_duration_min,
        "charging_strategy": "fast_charge" if max_kw >= 50 else "slow_charge",
        "confidence_score": 0.7,
        "reasoning": f"Recommended {best_by_score['name']} based on availability and power output.",
    }

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.3-70b-versatile",
            options={"json_mode": True, "max_tokens": 700}
        )
        parsed = parse_groq_json(content, fallback)
        return {**parsed, "all_candidates_full": top5}
    except Exception:
        return {**fallback, "all_candidates_full": top5}
