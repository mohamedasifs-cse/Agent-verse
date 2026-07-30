import json
from typing import Dict, Any, Optional
from utils.groq_client import call_groq, parse_groq_json

async def pricing_agent(
    charging_data: Optional[Dict[str, Any]],
    battery_state: Dict[str, Any],
    route_data: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    PRICING & COST AGENT
    Compares costs across candidate stations and estimates trip cost in Indian Rupees (₹).
    """
    stations = (charging_data or {}).get("all_candidates_full", [])
    soc = battery_state.get("soc", 50)
    soh = battery_state.get("soh", 95)
    soc_needed = max(0.0, 80.0 - soc)
    energy_needed_kwh = (soc_needed / 100.0) * 75.0 * (soh / 100.0)

    cost_table = []
    for s in stations:
        p_kwh = s.get("price_per_kwh", 22.0)
        cost_table.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "price_per_kwh": p_kwh,
            "estimated_cost": round(p_kwh * energy_needed_kwh, 2),
            "max_power_kw": s.get("max_power_kw"),
            "distance_km": s.get("distance_km"),
        })

    cost_table.sort(key=lambda x: x["estimated_cost"])
    cheapest = cost_table[0] if cost_table else None

    dist_km = (route_data or {}).get("distance_km", 0.0)
    route_energy_kwh = (dist_km / 100.0) * 20.0 if dist_km else 0.0

    avg_price_per_kwh = (sum(s.get("price_per_kwh", 22.0) for s in stations) / len(stations)) if stations else 22.0
    estimated_trip_cost = round(route_energy_kwh * avg_price_per_kwh, 2)

    petrol_cost = (dist_km / 100.0) * 8.0 * 102.0

    system_prompt = """You are a Pricing & Cost Optimization Agent for an Indian EV operating system.
All currency must be evaluated in Indian Rupees (₹).
Analyze charging costs and return ONLY a JSON object:
{
  "cheapest_station": { "name": string, "price_per_kwh": number, "estimated_cost": number },
  "estimated_trip_cost": number,
  "cost_comparison_table": [{ "name": string, "price_per_kwh": number, "estimated_cost": number, "value_score": string }],
  "savings_vs_petrol": number,
  "cost_per_km": number,
  "recommendation": string,
  "confidence_score": number (0-1)
}"""

    user_msg = f"""Energy needed to reach 80% SOC: {energy_needed_kwh:.1f} kWh
Cost comparison table (in INR ₹): {json.dumps(cost_table)}
Route distance: {dist_km} km, estimated trip energy: {route_energy_kwh:.1f} kWh
Petrol equivalent cost in India (at ₹102/L, 8L/100km): ₹{petrol_cost:.2f}"""

    fallback = {
        "cheapest_station": {
            "name": cheapest["name"],
            "price_per_kwh": cheapest["price_per_kwh"],
            "estimated_cost": cheapest["estimated_cost"]
        } if cheapest else None,
        "estimated_trip_cost": estimated_trip_cost,
        "cost_comparison_table": cost_table,
        "savings_vs_petrol": round(petrol_cost - estimated_trip_cost, 2),
        "cost_per_km": round(estimated_trip_cost / dist_km, 2) if dist_km else 2.10,
        "recommendation": f"Use {cheapest['name']} to minimize charging cost at ₹{cheapest['price_per_kwh']}/kWh" if cheapest else "No stations available for comparison",
        "confidence_score": 0.85,
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
