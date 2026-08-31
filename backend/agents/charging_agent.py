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
Given candidate charging stations, current live queue length, and battery state, return ONLY a JSON object:
{
  "recommended_station": { "id": string, "name": string, "reason": string, "recommended_slot": string },
  "all_candidates": [{ "id": string, "name": string, "score": number, "pros": [string], "cons": [string] }],
  "recommended_slot": string,
  "estimated_wait_minutes": number,
  "estimated_charging_duration_minutes": number,
  "charging_strategy": "fast_charge|slow_charge|opportunity_charge",
  "confidence_score": number (0-1),
  "reasoning": string
}"""

    user_msg = f"""Battery SOC: {battery_state.get("soc")}%, SOH: {battery_state.get("soh")}%
Target charge: 80% (optimal for battery health)
Candidate stations: {json.dumps(top5, indent=2)}
Recommend the best station considering distance, charging power, live queue length, available slots, and charging speed."""

    # Rule-based best selection fallback
    best_by_score = top5[0]
    best_score = -float('inf')
    for s in top5:
        q_len = s.get("queue_length", 0)
        score = (30 if s.get("available_bays", 1) > 0 else -10) + (s.get("max_power_kw", 50) / 10.0) - s.get("distance_km", 5) * 2.0 - q_len * 5.0
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

    rec_slot = "10:30 AM"
    est_wait = best_by_score.get("queue_length", 0) * 15

    fallback = {
        "recommended_station": {
            "id": best_by_score["id"],
            "name": best_by_score["name"],
            "reason": f"Optimal choice with {best_by_score.get('max_power_kw', 150)} kW charging power and short queue.",
            "recommended_slot": rec_slot
        },
        "all_candidates": [{"id": s["id"], "name": s["name"], "score": 0.8 if s["id"] == best_by_score["id"] else 0.6, "pros": [f"{s.get('max_power_kw', 50)}kW Fast Charging"], "cons": [f"{s.get('queue_length', 0)} in queue"]} for s in top5],
        "recommended_slot": rec_slot,
        "estimated_wait_minutes": est_wait,
        "estimated_charging_duration_minutes": charge_duration_min,
        "charging_strategy": "fast_charge" if max_kw >= 50 else "slow_charge",
        "confidence_score": 0.85,
        "reasoning": f"Recommended {best_by_score['name']} because it is {best_by_score.get('distance_km', 5)} km away, offers {max_kw} kW charging power, and currently has a low wait queue. Recommended slot: {rec_slot}.",
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

