import json
from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json

async def battery_agent(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    BATTERY INTELLIGENCE AGENT
    Analyzes real-time telemetry and returns structured battery health assessment.
    """
    soc = telemetry.get("soc", 80)
    soh = telemetry.get("soh", 95)
    est_range = telemetry.get("estimatedRangeKm", 300)
    temp_status = telemetry.get("temperatureStatus", "normal")

    system_prompt = """You are a Battery Intelligence Agent for an EV operating system.
Analyze the provided battery telemetry and return ONLY a JSON object with this exact schema:
{
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
}"""

    user_msg = f"Battery telemetry: {json.dumps(telemetry)}\nAssess battery health, determine if charging is needed, and provide recommendations."

    fallback = {
        "soc_percent": soc,
        "soh_percent": soh,
        "estimated_range_km": est_range,
        "temperature_status": temp_status,
        "charging_needed": soc < 20,
        "urgency": "critical" if soc < 10 else "high" if soc < 20 else "none",
        "health_grade": "A" if soh > 90 else "B" if soh > 80 else "C",
        "recommendations": ["Monitor battery temperature", "Charge when below 20%"],
        "confidence_score": 0.6,
        "reasoning": "Fallback assessment based on raw telemetry values.",
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
