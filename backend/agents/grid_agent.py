import datetime
from typing import Dict, Any, Optional
from utils.groq_client import call_groq, parse_groq_json

async def grid_agent(telemetry: Dict[str, Any], charging_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    GRID LOAD & RENEWABLE ENERGY OPTIMIZATION AGENT
    Analyzes local electrical grid carbon intensity, V2G feasibility, solar availability, and off-peak tariffs.
    """
    current_hour = datetime.datetime.now().hour
    is_off_peak = current_hour >= 22 or current_hour <= 6
    is_solar_peak = 10 <= current_hour <= 16

    soc = telemetry.get("soc", 80)

    fallback = {
        "grid_status": "High Solar Generation (Clean Grid)" if is_solar_peak else "Off-Peak Tariff Window" if is_off_peak else "Peak Grid Demand",
        "carbon_intensity_g_kwh": 180 if is_solar_peak else 240 if is_off_peak else 410,
        "v2g_capable": True,
        "v2g_recommendation": "V2G discharge candidate: Earn revenue by supplying power to local microgrid." if (soc > 70 and not is_off_peak) else "Hold charge for vehicle usage.",
        "optimal_charging_window": "22:00 - 06:00 (Lowest Carbon & Cost)",
        "grid_confidence": 0.91,
    }

    system_prompt = f"""You are the Grid Load & Renewable Energy Optimization Agent.
Analyze electrical grid carbon intensity and V2G (Vehicle-to-Grid) feasibility for EV SOC={soc}%.
Return JSON:
{{
  "grid_status": string,
  "carbon_intensity_g_kwh": number,
  "v2g_capable": boolean,
  "v2g_recommendation": string,
  "optimal_charging_window": string,
  "grid_confidence": number (0-1)
}}"""

    try:
        content = await call_groq([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"EV SOC: {soc}%, hour: {current_hour}"}
        ], model="llama-3.3-70b-versatile", options={"json_mode": True, "max_tokens": 300})

        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception as err:
        print(f"[GridAgent] Groq call failed, using rule-based fallback: {err}")
        return fallback
