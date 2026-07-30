import json
from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json
from utils.distance_calculator import road_distance_km, travel_time_minutes

async def route_agent(origin: Dict[str, float], destination: Dict[str, float], battery_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ROUTE INTELLIGENCE AGENT
    Calculates route feasibility using Haversine + road correction factor.
    """
    dist_km = road_distance_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"])
    travel_min = travel_time_minutes(dist_km)

    energy_needed_kwh = (dist_km / 100.0) * 20.0
    soh = battery_state.get("soh", 95)
    soc = battery_state.get("soc", 80)
    battery_capacity_kwh = 75.0 * (soh / 100.0)
    energy_needed_percent = round((energy_needed_kwh / battery_capacity_kwh) * 100.0, 1)
    charging_stop_required = (soc - energy_needed_percent) < 10.0

    system_prompt = """You are a Route Intelligence Agent for an EV operating system.
Given route data and battery state, return ONLY a JSON object:
{
  "distance_km": number,
  "estimated_energy_needed_percent": number,
  "travel_time_minutes": number,
  "charging_stop_required": boolean,
  "feasibility": "feasible|marginal|infeasible",
  "alternative_routes": [{"name": string, "distance_km": number, "energy_percent": number, "description": string}],
  "waypoint_suggestions": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}"""

    user_msg = f"""Route: {json.dumps(origin)} → {json.dumps(destination)}
Calculated distance: {dist_km:.1f} km, travel time: {travel_min:.0f} min
Energy needed: {energy_needed_percent}% of battery
Current SOC: {soc}%, SOH: {soh}%, Range: {battery_state.get("estimatedRangeKm")} km
Provide route analysis and alternatives."""

    fallback = {
        "distance_km": round(dist_km, 1),
        "estimated_energy_needed_percent": energy_needed_percent,
        "travel_time_minutes": round(travel_min, 0),
        "charging_stop_required": charging_stop_required,
        "feasibility": "marginal" if charging_stop_required else "feasible",
        "alternative_routes": [],
        "waypoint_suggestions": ["Plan a charging stop at the midpoint"] if charging_stop_required else [],
        "confidence_score": 0.75,
        "reasoning": f"Route is {dist_km:.1f} km requiring ~{energy_needed_percent}% battery.",
    }

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.3-70b-versatile",
            options={"json_mode": True, "max_tokens": 600}
        )
        parsed = parse_groq_json(content, fallback)
        return {**parsed, "distance_km": fallback["distance_km"], "travel_time_minutes": fallback["travel_time_minutes"]}
    except Exception:
        return fallback
