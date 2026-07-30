from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json

async def driver_agent(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    DRIVER BEHAVIOR & SAFETY AGENT
    Analyzes driving smoothness, eco-driving score, regen braking, and driver fatigue/safety.
    """
    speed = telemetry.get("speedKmh", 0)
    is_driving = telemetry.get("mode") == "driving"

    if is_driving:
        eco_score = 72 if speed > 110 else 86 if speed > 85 else 94
    else:
        eco_score = 98

    total_dist = telemetry.get("totalDistanceKm", 0)
    regen_recovered_kwh = round(total_dist * 0.04 if total_dist else 1.2, 1)

    fallback = {
        "eco_score": eco_score,
        "driving_style": "Aggressive / High Speed" if speed > 100 else "Smooth / Eco-Optimal" if speed > 40 else "Parked / City Traffic",
        "regen_recovered_kwh": regen_recovered_kwh,
        "safety_rating": "A+" if eco_score >= 90 else "A" if eco_score >= 80 else "B",
        "coaching_tip": "Reduce highway cruising speed by 10 km/h to increase range by ~14%." if speed > 100 else "Excellent smooth throttle modulation. Maximize one-pedal regenerative braking.",
        "confidence_score": 0.94,
    }

    system_prompt = f"""You are the Driver Behavior & Safety Agent for an EV.
Analyze driving metrics: speed={speed} km/h, distance={total_dist} km.
Evaluate eco-score (0-100), regenerative braking, and safety rating.
Return JSON:
{{
  "eco_score": number,
  "driving_style": string,
  "regen_recovered_kwh": number,
  "safety_rating": string,
  "coaching_tip": string,
  "confidence_score": number (0-1)
}}"""

    try:
        content = await call_groq([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Driver data: speed={speed}km/h, distance={total_dist}km"}
        ], model="llama-3.3-70b-versatile", options={"json_mode": True, "max_tokens": 300})

        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception as err:
        print(f"[DriverAgent] Groq call failed, using rule-based fallback: {err}")
        return fallback
