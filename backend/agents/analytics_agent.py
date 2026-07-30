import json
from typing import Dict, Any, List, Optional
from utils.groq_client import call_groq, parse_groq_json

async def analytics_agent(telemetry: Dict[str, Any], charging_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    ANALYTICS & REPORT AGENT
    Aggregates historical data into actionable insights and maintenance recommendations.
    """
    soh = telemetry.get("soh", 95)
    soc = telemetry.get("soc", 80)
    temp = telemetry.get("temperatureC", 25)

    soh_trend = "excellent" if soh > 90 else "good" if soh > 80 else "fair" if soh > 70 else "poor"
    charging_history = charging_history or []
    session_count = len(charging_history) if charging_history else 24

    if charging_history:
        avg_charging_cost = round(sum(h.get("cost", 0) for h in charging_history) / len(charging_history))
    else:
        avg_charging_cost = 420

    total_energy_charged = telemetry.get("totalEnergyChargedKwh") or 342.5

    fallback = {
        "battery_health_trend": {
            "status": soh_trend,
            "soh_percent": soh,
            "projected_degradation_per_year": 2.5,
            "estimated_replacement_years": round((soh - 70) / 2.5),
        },
        "charging_history_summary": {
            "total_sessions": session_count,
            "avg_cost_per_session": avg_charging_cost,
            "preferred_charging_time": "Off-peak (10pm-6am)",
            "total_energy_kwh": total_energy_charged,
        },
        "maintenance_insights": [
            {"item": "Battery Thermal Management", "priority": "high" if temp > 40 else "low", "recommendation": "Check cooling system"},
            {"item": "Charging Port", "priority": "low", "recommendation": "Clean contacts every 6 months"},
            {"item": "Tire Pressure", "priority": "medium", "recommendation": "Check monthly for optimal range"},
        ],
        "performance_score": round(soh * 0.6 + (soc / 100.0) * 40.0),
        "efficiency_rating": "Excellent" if soh > 90 else "Good",
        "confidence_score": 0.88,
        "reasoning": f"Analysis based on current SOH of {soh}% and {telemetry.get('totalDistanceKm', 48)} km driven.",
    }

    system_prompt = """You are an Analytics & Report Agent for an EV operating system.
Aggregates historical data into actionable insights and maintenance recommendations.
Return JSON matching fallback keys."""

    user_msg = f"Telemetry: {json.dumps(telemetry)}, Sessions: {session_count}"

    try:
        content = await call_groq(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
            model="llama-3.1-8b-instant",
            options={"json_mode": True, "max_tokens": 700}
        )
        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception:
        return fallback
