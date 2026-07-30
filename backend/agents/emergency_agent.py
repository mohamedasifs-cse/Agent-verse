import json
import random
from typing import Dict, Any, List
from utils.groq_client import call_groq, parse_groq_json
from utils.charging_station_fetcher import fetch_nearby_stations

def generate_v2v_candidates(lat: float, lon: float) -> List[Dict[str, Any]]:
    names = ["Tesla Model 3", "Rivian R1T", "Chevy Bolt", "Hyundai Ioniq 5", "Ford F-150 Lightning"]
    candidates = []
    for i in range(3):
        willing = random.random() > 0.3
        if willing:
            candidates.append({
                "id": f"v2v_{i + 1}",
                "vehicle": random.choice(names),
                "owner": f"EV Owner {i + 1}",
                "lat": lat + (random.random() - 0.5) * 0.05,
                "lon": lon + (random.random() - 0.5) * 0.05,
                "available_soc": random.randint(60, 95),
                "shareable_kwh": round(5.0 + random.random() * 15.0, 1),
                "distance_km": round(0.5 + random.random() * 3.0, 2),
                "willing_to_share": True,
            })
    return candidates

async def emergency_agent(telemetry: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
    """
    EMERGENCY ASSISTANCE AGENT
    Detects critical battery levels, finds V2V candidates and nearest real station.
    """
    soc = telemetry.get("soc", 80)
    is_emergency = soc < 15
    urgency_level = "critical" if soc < 5 else "high" if soc < 10 else "medium" if soc < 15 else "none"

    v2v_candidates = generate_v2v_candidates(lat, lon) if is_emergency else []
    nearby_stations = await fetch_nearby_stations(lat, lon, 10.0, 3) if is_emergency else []
    nearest_station = nearby_stations[0] if nearby_stations else None

    if not is_emergency:
        return {
            "is_emergency": False,
            "urgency_level": "none",
            "recommended_action": "Battery level is safe. No emergency action required.",
            "nearest_charging_station": None,
            "v2v_candidate_vehicle": None,
            "v2v_candidates": [],
            "confidence_score": 0.99,
            "reasoning": f"SOC at {soc}% — well above emergency threshold of 15%.",
        }

    system_prompt = """You are an Emergency Assistance Agent for an EV operating system.
The vehicle has a critically low battery. Analyze the situation and return ONLY a JSON object:
{
  "is_emergency": true,
  "urgency_level": "medium|high|critical",
  "recommended_action": string,
  "nearest_charging_station": { "name": string, "distance_km": number, "power_kw": number } | null,
  "v2v_candidate_vehicle": { "vehicle": string, "distance_km": number, "shareable_kwh": number } | null,
  "immediate_steps": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}"""

    user_msg = f"""EMERGENCY: Vehicle SOC at {soc}%, range: {telemetry.get("estimatedRangeKm")} km
Nearest charging station: {json.dumps(nearest_station) if nearest_station else "None found"}
V2V candidates available: {json.dumps(v2v_candidates)}
Provide emergency action plan."""

    fallback = {
        "is_emergency": True,
        "urgency_level": urgency_level,
        "recommended_action": (
            f"Drive immediately to {nearest_station['name']} ({nearest_station['distance_km']} km away)" if nearest_station
            else f"Request V2V energy transfer from {v2v_candidates[0]['vehicle']} ({v2v_candidates[0]['distance_km']} km away)" if v2v_candidates
            else "Pull over safely and call roadside assistance"
        ),
        "nearest_charging_station": {
            "name": nearest_station["name"],
            "distance_km": nearest_station["distance_km"],
            "power_kw": nearest_station["max_power_kw"],
        } if nearest_station else None,
        "v2v_candidate_vehicle": v2v_candidates[0] if v2v_candidates else None,
        "immediate_steps": ["Reduce speed to extend range", "Turn off AC/heating", "Navigate to nearest charger"],
        "confidence_score": 0.85,
        "reasoning": f"Emergency detected at {soc}% SOC.",
    }

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.3-70b-versatile",
            options={"json_mode": True, "max_tokens": 600}
        )
        return {**fallback, **parse_groq_json(content, fallback), "v2v_candidates": v2v_candidates}
    except Exception:
        return {**fallback, "v2v_candidates": v2v_candidates}
