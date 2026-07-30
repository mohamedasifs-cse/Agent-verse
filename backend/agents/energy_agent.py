import json
from typing import Dict, Any, Optional
from utils.groq_client import call_groq, parse_groq_json

async def energy_agent(telemetry: Dict[str, Any], charging_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    ENERGY & SUSTAINABILITY AGENT
    Calculates carbon savings vs petrol equivalent and scores green charging options.
    """
    dist_driven = telemetry.get("totalDistanceKm", 0.0)
    carbon_saved_kg = round((dist_driven * (120.0 - 50.0)) / 1000.0, 2)
    trees_equivalent = round(carbon_saved_kg / 21.77, 2)

    green_stations = []
    if charging_data and charging_data.get("all_candidates_full"):
        green_stations = [s for s in charging_data["all_candidates_full"] if s.get("is_green")]

    system_prompt = """You are an Energy & Sustainability Agent for an EV operating system.
Analyze energy usage and sustainability metrics. Return ONLY a JSON object:
{
  "carbon_saved_kg": number,
  "trees_equivalent": number,
  "sustainability_score": number (0-100),
  "grid_carbon_intensity": "low|medium|high",
  "green_recommendation": string,
  "green_stations": [{ "name": string, "reason": string }],
  "renewable_percentage_estimate": number,
  "confidence_score": number (0-1),
  "reasoning": string
}"""

    user_msg = f"""Vehicle stats: {json.dumps(telemetry)}
Carbon saved vs petrol: {carbon_saved_kg} kg ({trees_equivalent} trees/year equivalent)
Green-flagged stations nearby: {len(green_stations)}
Station data: {json.dumps(green_stations[:3])}
Provide sustainability assessment."""

    fallback = {
        "carbon_saved_kg": carbon_saved_kg,
        "trees_equivalent": trees_equivalent,
        "sustainability_score": min(100, int(50 + carbon_saved_kg * 0.5)),
        "grid_carbon_intensity": "medium",
        "green_recommendation": (
            f"Prefer {green_stations[0]['name']} for greener charging" if green_stations
            else "Consider charging during off-peak hours for lower grid carbon intensity"
        ),
        "green_stations": [{"name": s["name"], "reason": "Solar/renewable flagged"} for s in green_stations[:3]],
        "renewable_percentage_estimate": 35,
        "confidence_score": 0.72,
        "reasoning": f"Based on {dist_driven:.0f} km driven, saved {carbon_saved_kg} kg CO2 vs petrol.",
    }

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.1-8b-instant",
            options={"json_mode": True, "max_tokens": 500}
        )
        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception:
        return fallback
