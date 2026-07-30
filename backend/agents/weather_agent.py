from typing import Dict, Any, Optional
from utils.groq_client import call_groq, parse_groq_json

async def weather_agent(telemetry: Dict[str, Any], origin: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """
    WEATHER & CLIMATE INTELLIGENCE AGENT
    Analyzes ambient climate, wind velocity, thermal load, and impact on EV range.
    """
    temp_c = telemetry.get("temperatureC", 25)
    speed = telemetry.get("speedKmh", 60)

    thermal_hvac_drain = (temp_c - 35) * 1.5 if temp_c > 35 else (10 - temp_c) * 2.0 if temp_c < 10 else 0.0
    wind_penalty_percent = round((speed - 90) * 0.25, 1) if speed > 90 else 0.0
    range_impact_percent = round(thermal_hvac_drain + wind_penalty_percent, 1)

    fallback = {
        "ambient_temp_c": temp_c,
        "weather_condition": "Extreme Heat / Tropical" if temp_c > 35 else "Cold Front" if temp_c < 5 else "Clear / Optimal",
        "hvac_power_kw": round(thermal_hvac_drain * 0.1, 1),
        "range_impact_percent": range_impact_percent,
        "recommended_cabin_temp_c": 22,
        "advice": "Pre-cool vehicle while plugged in to preserve drive range." if temp_c > 35 else "Optimal climate conditions for peak EV efficiency.",
        "confidence_score": 0.92,
    }

    system_prompt = f"""You are the Weather & Climate Intelligence Agent for an EV.
Analyze ambient temperature ({temp_c}°C) and vehicle speed ({speed} km/h).
Calculate HVAC thermal energy impact and cabin climate optimization advice.
Return JSON:
{{
  "ambient_temp_c": number,
  "weather_condition": string,
  "hvac_power_kw": number,
  "range_impact_percent": number,
  "recommended_cabin_temp_c": number,
  "advice": string,
  "confidence_score": number (0-1)
}}"""

    try:
        content = await call_groq([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Telemetry: temp={temp_c}°C, speed={speed}km/h"}
        ], model="llama-3.3-70b-versatile", options={"json_mode": True, "max_tokens": 300})

        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception as err:
        print(f"[WeatherAgent] Groq call failed, using rule-based fallback: {err}")
        return fallback
