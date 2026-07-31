import json
from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json

async def battery_agent(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    BATTERY INTELLIGENCE AGENT
    Analyzes real-time telemetry for Car (40-75 kWh, 300-600 km range) or Bike (2-6 kWh, 80-180 km range).
    """
    soc = telemetry.get("soc", 80)
    soh = telemetry.get("soh", 95)
    v_type = telemetry.get("vehicleType", "car")
    default_range = 135 if v_type == "bike" else 300
    est_range = telemetry.get("estimatedRangeKm", default_range)
    temp_status = telemetry.get("temperatureStatus", "normal")

    system_prompt = f"""You are a Battery Intelligence Agent for an EV operating system supporting both Electric Cars and Electric Bikes/Scooters.
Current Vehicle Type: {v_type.upper()}.
Specs context:
- Electric Car: Battery Capacity 40–75 kWh, Average Range 300–600 km.
- Electric Bike/Scooter: Battery Capacity 2–6 kWh, Average Range 80–180 km, Normal charging 2–5 hours.

Analyze the provided battery telemetry and return ONLY a JSON object with this exact schema:
{{
  "soc_percent": number,
  "soh_percent": number,
  "estimated_range_km": number,
  "temperature_status": "normal|warm|cold|critical",
  "charging_needed": boolean,
  "urgency": "none|low|medium|high|critical",
  "health_grade": "A|B|C|D|F",
  "recommendations": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}}"""

    user_msg = f"Vehicle Type: {v_type}\nBattery telemetry: {json.dumps(telemetry)}\nAssess battery health, determine if charging is needed, and provide vehicle-specific recommendations."

    recs = (
        ["Maintain 20-80% battery band for long smart pack life", "Standard AC charging takes 2-4 hours"]
        if v_type == "bike"
        else ["Monitor battery thermal management", "Fast DC charging recommended below 20%"]
    )

    fallback = {
        "soc_percent": soc,
        "soh_percent": soh,
        "estimated_range_km": est_range,
        "temperature_status": temp_status,
        "charging_needed": soc < 20,
        "urgency": "critical" if soc < 10 else "high" if soc < 20 else "none",
        "health_grade": "A" if soh > 90 else "B" if soh > 80 else "C",
        "recommendations": recs,
        "confidence_score": 0.85,
        "reasoning": f"Assessment for {v_type} based on telemetry values.",
    }

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.3-70b-versatile",
            options={"json_mode": True, "max_tokens": 512}
        )
        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception:
        return fallback

