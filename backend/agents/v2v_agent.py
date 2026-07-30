from typing import Dict, Any, List
from utils.groq_client import call_groq, parse_groq_json

HELPER_EV_POOL = [
    {"id": "helper-ev-1", "owner": "Rajeswari S.", "vehicle": "TATA Nexon EV Max", "distance_m": 450, "soc": 88, "max_export_kw": 22, "cable": "CCS2 Bidirectional V2V", "rating": 4.9, "location": "450m East (2 min away)"},
    {"id": "helper-ev-2", "owner": "Vikram R.", "vehicle": "Hyundai Ioniq 5", "distance_m": 850, "soc": 92, "max_export_kw": 30, "cable": "CCS2 Bidirectional V2V", "rating": 4.8, "location": "850m North (4 min away)"},
    {"id": "helper-ev-3", "owner": "Ananya M.", "vehicle": "MG ZS EV", "distance_m": 1400, "soc": 79, "max_export_kw": 15, "cable": "Type 2 V2V Adaptor", "rating": 4.7, "location": "1.4km West (6 min away)"},
    {"id": "helper-ev-4", "owner": "Karthik K.", "vehicle": "Mahindra XUV400 EV", "distance_m": 2100, "soc": 82, "max_export_kw": 22, "cable": "CCS2 Bidirectional V2V", "rating": 4.9, "location": "2.1km South (9 min away)"},
]

async def v2v_agent(telemetry: Dict[str, Any], lat: float = 37.7749, lon: float = -122.4194) -> Dict[str, Any]:
    """
    VEHICLE-TO-VEHICLE (V2V) CHARGE TRANSFER AGENT
    Detects low battery (SoC <= 12%), discovers nearby opted-in helper EVs,
    matches optimal helper vehicle, handles request & secure power transfer.
    """
    soc = telemetry.get("soc", 8)
    is_emergency_v2v = soc <= 12

    required_energy_kwh = 8.0
    estimated_reward_inr = 250

    candidate_helpers = []
    for helper in HELPER_EV_POOL:
        dist_score = max(0.0, 100.0 - (helper["distance_m"] / 30.0))
        soc_score = helper["soc"]
        match_score = round((dist_score * 0.5) + (soc_score * 0.4) + (helper["rating"] * 2.0))
        candidate_helpers.append({
            **helper,
            "match_score": min(99, match_score),
            "transfer_energy_kwh": required_energy_kwh,
            "estimated_reward_inr": estimated_reward_inr,
            "estimated_transfer_mins": round((required_energy_kwh / helper["max_export_kw"]) * 60.0),
        })

    candidate_helpers.sort(key=lambda x: x["match_score"], reverse=True)
    best_helper = candidate_helpers[0] if candidate_helpers else HELPER_EV_POOL[0]

    fallback = {
        "is_v2v_required": is_emergency_v2v,
        "battery_critical": soc <= 10,
        "required_energy_kwh": required_energy_kwh,
        "matched_helper": best_helper,
        "all_candidate_helpers": candidate_helpers,
        "estimated_reward_inr": estimated_reward_inr,
        "recommended_action": (
            f"Emergency V2V Mode Active: Request 8 kWh from {best_helper['owner']} ({best_helper['vehicle']}, {best_helper['distance_m']}m away)"
            if is_emergency_v2v else "Battery level sufficient — V2V Emergency Share available on standby"
        ),
        "confidence_score": 0.96,
    }

    system_prompt = f"""You are the Vehicle-to-Vehicle (V2V) Charge Transfer AI Agent.
Analyze low battery state (SoC={soc}%) and matched helper vehicle ({best_helper['vehicle']}, {best_helper['distance_m']}m away).
Synthesize emergency V2V matching recommendation.
Return JSON:
{{
  "is_v2v_required": boolean,
  "battery_critical": boolean,
  "required_energy_kwh": number,
  "matched_helper": object,
  "estimated_reward_inr": number,
  "recommended_action": string,
  "confidence_score": number (0-1)
}}"""

    try:
        content = await call_groq([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Battery SoC: {soc}%, Matched Helper: {best_helper['owner']} ({best_helper['vehicle']})"}
        ], model="llama-3.3-70b-versatile", options={"json_mode": True, "max_tokens": 400})

        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception as err:
        print(f"[V2VAgent] Groq call failed, using rule-based fallback: {err}")
        return fallback
