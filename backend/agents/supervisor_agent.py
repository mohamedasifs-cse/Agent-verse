import json
import time
import datetime
import asyncio
from typing import Dict, Any, List, Optional
from utils.groq_client import call_groq, parse_groq_json
from agents.battery_agent import battery_agent
from agents.weather_agent import weather_agent
from agents.driver_agent import driver_agent
from agents.maintenance_agent import maintenance_agent
from agents.route_agent import route_agent
from agents.charging_agent import charging_agent
from agents.emergency_agent import emergency_agent
from agents.grid_agent import grid_agent
from agents.v2v_agent import v2v_agent
from agents.energy_agent import energy_agent
from agents.pricing_agent import pricing_agent
from agents.analytics_agent import analytics_agent

async def supervisor_agent(request_data: Dict[str, Any], sio=None) -> Dict[str, Any]:
    """
    SUPERVISOR AGENT — Master Multi-Agent Orchestrator
    Runs 12 specialized domain AI agents in parallel/sequential stages,
    then synthesizes all outputs into a unified recommendation.
    """
    telemetry = request_data.get("telemetry", {})
    origin = request_data.get("origin")
    destination = request_data.get("destination")
    charging_history = request_data.get("chargingHistory", [])

    lat = origin.get("lat", 37.7749) if origin else 37.7749
    lon = origin.get("lon", -122.4194) if origin else -122.4194

    agent_log: List[Dict[str, Any]] = []
    start_time = time.time()

    async def emit(event: str, data: Any):
        if sio:
            await sio.emit(event, data)

    async def log_agent(name: str, result: Dict[str, Any], duration_ms: float) -> Dict[str, Any]:
        entry = {
            "agent": name,
            "result": result,
            "durationMs": duration_ms,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        agent_log.append(entry)
        await emit("agent:update", entry)
        print(f"[Supervisor] {name} completed in {duration_ms:.0f}ms")
        return result

    async def run_agent(name: str, coro_fn) -> Dict[str, Any]:
        await emit("agent:start", {"agent": name, "timestamp": datetime.datetime.utcnow().isoformat() + "Z"})
        t0 = time.time()
        try:
            res = await coro_fn()
            duration = round((time.time() - t0) * 1000)
            return await log_agent(name, res, duration)
        except Exception as err:
            print(f"[Supervisor] {name} failed: {err}")
            fallback = {"error": str(err), "confidence_score": 0, "reasoning": "Agent failed"}
            duration = round((time.time() - t0) * 1000)
            return await log_agent(name, fallback, duration)

    # ── Step 1: Core System Agents (Parallel Stage 1) ──
    battery_res, weather_res, driver_res, maintenance_res = await asyncio.gather(
        run_agent("Battery Intelligence", lambda: battery_agent(telemetry)),
        run_agent("Weather & Climate Intelligence", lambda: weather_agent(telemetry, origin)),
        run_agent("Driver Behavior & Safety", lambda: driver_agent(telemetry)),
        run_agent("Predictive Fleet Maintenance", lambda: maintenance_agent(telemetry))
    )

    # ── Step 2: Route & Charging Intelligence (Parallel Stage 2) ──
    if origin and destination:
        route_coro = run_agent("Route Intelligence", lambda: route_agent(origin, destination, telemetry))
    else:
        async def skipped_route():
            return {"skipped": True, "reason": "No destination provided"}
        route_coro = skipped_route()

    charging_coro = run_agent("Charging Intelligence", lambda: charging_agent(lat, lon, telemetry))

    route_res, charging_res = await asyncio.gather(route_coro, charging_coro)

    # ── Step 3: Emergency, V2G & V2V Safety Agents (Parallel Stage 3) ──
    emergency_res, grid_res, v2v_res = await asyncio.gather(
        run_agent("Emergency Assistance", lambda: emergency_agent(telemetry, lat, lon)),
        run_agent("Grid Load & V2G Optimization", lambda: grid_agent(telemetry, charging_res)),
        run_agent("V2V Charge Transfer", lambda: v2v_agent(telemetry, lat, lon))
    )

    # ── Step 4: Sustainability, Pricing & Analytics (Parallel Stage 4) ──
    energy_res, pricing_res, analytics_res = await asyncio.gather(
        run_agent("Energy & Sustainability", lambda: energy_agent(telemetry, charging_res)),
        run_agent("Pricing & Cost", lambda: pricing_agent(charging_res, telemetry, route_res)),
        run_agent("Analytics & Reports", lambda: analytics_agent(telemetry, charging_history))
    )

    # ── Step 5: Final Groq Synthesis ──
    await emit("agent:start", {"agent": "Supervisor Synthesis", "timestamp": datetime.datetime.utcnow().isoformat() + "Z"})

    synthesis_prompt = """You are the Supervisor Agent of a 12-Agent EV Multi-Agent Operating System.
You have received outputs from 12 specialized AI domain agents (Battery, Route, Charging, Emergency, Energy, Pricing, Analytics, Weather, Driver, Grid, Maintenance, V2V Charge Transfer).
Synthesize them into ONE unified, prioritized executive recommendation for the EV driver.
If battery <= 10%, prioritize Emergency V2V Charge Transfer!
Return ONLY a JSON object:
{
  "priority_action": string,
  "summary": string,
  "key_insights": [string],
  "overall_status": "optimal|good|attention_needed|critical",
  "next_steps": [{ "step": number, "action": string, "urgency": "low|medium|high|critical" }],
  "confidence_score": number (0-1)
}"""

    soc = telemetry.get("soc", 80)
    matched_helper = (v2v_res.get("matched_helper") or {})
    rec_station = (charging_res.get("recommended_station") or {})

    synthesis_user = f"""12 Agent outputs summary:
- Battery: SOC {soc}%, SOH {telemetry.get('soh')}%
- Route: {"No route" if route_res.get('skipped') else f"{route_res.get('distance_km')}km"}
- Charging: Station {rec_station.get('name', 'N/A')}
- Emergency: is_emergency={emergency_res.get('is_emergency')}
- V2V Transfer: is_v2v_required={v2v_res.get('is_v2v_required')}, matched_helper={matched_helper.get('owner')} ({matched_helper.get('vehicle')}, {matched_helper.get('distance_m')}m)
- Energy: carbon_saved={energy_res.get('carbon_saved_kg')}kg
- Pricing: trip_cost=₹{pricing_res.get('estimated_trip_cost', 0)}
- Analytics: performance_score={analytics_res.get('performance_score')}
- Weather: impact={weather_res.get('range_impact_percent')}%, temp={weather_res.get('ambient_temp_c')}°C
- Driver: eco_score={driver_res.get('eco_score')}, rating={driver_res.get('safety_rating')}
- Grid: {grid_res.get('grid_status')}, V2G={grid_res.get('v2g_recommendation')}
- Maintenance: vehicle_health={maintenance_res.get('overall_vehicle_health')}
Synthesize unified recommendation."""

    synth_fallback = {
        "priority_action": (
            f"EMERGENCY V2V MODE: Connect 8 kWh V2V Transfer from {matched_helper.get('owner', 'Nearby Helper EV')} ({matched_helper.get('distance_m', 450)}m away)"
            if soc <= 10 else emergency_res.get("recommended_action") if emergency_res.get("is_emergency")
            else f"Charge at {rec_station.get('name', 'optimal station')}" if battery_res.get("charging_needed")
            else "Vehicle operating in peak condition across all 12 AI agent domains"
        ),
        "summary": f"EV Fleet status: SOC {soc}%, Eco-Score {driver_res.get('eco_score')}/100. {'EMERGENCY LOW BATTERY — V2V SHARE ACTIVATED.' if soc <= 10 else 'All 12 specialized AI agent domains nominal.'}",
        "key_insights": [
            f"V2V Emergency Share: {matched_helper.get('owner')} ({matched_helper.get('distance_m')}m away)",
            f"Battery & Maintenance: {battery_res.get('health_grade', 'A')} ({maintenance_res.get('overall_vehicle_health')})",
            f"Driver Eco Score: {driver_res.get('eco_score')}/100 ({driver_res.get('driving_style')})",
            f"Grid Status: {grid_res.get('grid_status')}",
        ],
        "overall_status": "critical" if (soc <= 10 or emergency_res.get("is_emergency")) else "attention_needed" if battery_res.get("charging_needed") else "optimal",
        "next_steps": [
            {"step": 1, "action": "Initiate Emergency V2V Charge Transfer with nearby helper EV" if soc <= 10 else "Maintain smooth speed cruising for maximum battery longevity", "urgency": "critical" if soc <= 10 else "low"},
            {"step": 2, "action": f"Target off-peak grid window: {grid_res.get('optimal_charging_window')}", "urgency": "medium"},
        ],
        "confidence_score": 0.96,
    }

    synthesis_result = synth_fallback
    try:
        t0 = time.time()
        content = await call_groq(
            [{"role": "system", "content": synthesis_prompt}, {"role": "user", "content": synthesis_user}],
            model="llama-3.3-70b-versatile",
            options={"json_mode": True, "max_tokens": 600}
        )
        parsed_synth = parse_groq_json(content, synth_fallback)
        synthesis_result = {**synth_fallback, **parsed_synth}
        duration = round((time.time() - t0) * 1000)
        await log_agent("Supervisor Synthesis", synthesis_result, duration)
    except Exception:
        await log_agent("Supervisor Synthesis", synth_fallback, 0)

    total_duration = round((time.time() - start_time) * 1000)
    await emit("agent:complete", {"totalDuration": total_duration, "agentLog": agent_log})

    return {
        "synthesis": synthesis_result,
        "agents": {
            "battery": battery_res,
            "route": route_res,
            "charging": charging_res,
            "emergency": emergency_res,
            "v2v": v2v_res,
            "energy": energy_res,
            "pricing": pricing_res,
            "analytics": analytics_res,
            "weather": weather_res,
            "driver": driver_res,
            "grid": grid_res,
            "maintenance": maintenance_res,
        },
        "agentLog": agent_log,
        "totalDurationMs": total_duration,
    }
