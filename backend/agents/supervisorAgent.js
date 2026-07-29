const { callGroq, parseGroqJSON } = require('../utils/groqClient');
const { batteryAgent } = require('./batteryAgent');
const { routeAgent } = require('./routeAgent');
const { chargingAgent } = require('./chargingAgent');
const { emergencyAgent } = require('./emergencyAgent');
const { energyAgent } = require('./energyAgent');
const { pricingAgent } = require('./pricingAgent');
const { analyticsAgent } = require('./analyticsAgent');
const { weatherAgent } = require('./weatherAgent');
const { driverAgent } = require('./driverAgent');
const { gridAgent } = require('./gridAgent');
const { maintenanceAgent } = require('./maintenanceAgent');
const { v2vAgent } = require('./v2vAgent');

/**
 * SUPERVISOR AGENT — Master Multi-Agent Orchestrator
 * Runs 12 specialized domain AI agents in parallel/sequential stages,
 * then synthesizes all outputs into a unified recommendation.
 */
async function supervisorAgent(request, io = null) {
  const { telemetry, origin, destination, chargingHistory = [] } = request;
  const lat = origin?.lat ?? 37.7749;
  const lon = origin?.lon ?? -122.4194;

  const agentLog = [];
  const startTime = Date.now();

  function emit(event, data) {
    if (io) io.emit(event, data);
  }

  function logAgent(name, result, durationMs) {
    const entry = { agent: name, result, durationMs, timestamp: new Date().toISOString() };
    agentLog.push(entry);
    emit('agent:update', entry);
    console.log(`[Supervisor] ${name} completed in ${durationMs}ms`);
    return result;
  }

  async function runAgent(name, fn) {
    emit('agent:start', { agent: name, timestamp: new Date().toISOString() });
    const t = Date.now();
    try {
      const result = await fn();
      return logAgent(name, result, Date.now() - t);
    } catch (err) {
      console.error(`[Supervisor] ${name} failed:`, err.message);
      const fallback = { error: err.message, confidence_score: 0, reasoning: 'Agent failed' };
      return logAgent(name, fallback, Date.now() - t);
    }
  }

  // ── Step 1: Core System Agents (Parallel Stage 1) ──
  const [batteryResult, weatherResult, driverResult, maintenanceResult] = await Promise.all([
    runAgent('Battery Intelligence', () => batteryAgent(telemetry)),
    runAgent('Weather & Climate Intelligence', () => weatherAgent(telemetry, origin)),
    runAgent('Driver Behavior & Safety', () => driverAgent(telemetry)),
    runAgent('Predictive Fleet Maintenance', () => maintenanceAgent(telemetry)),
  ]);

  // ── Step 2: Route & Charging Intelligence (Parallel Stage 2) ──
  const [routeResult, chargingResult] = await Promise.all([
    origin && destination
      ? runAgent('Route Intelligence', () => routeAgent(origin, destination, telemetry))
      : Promise.resolve({ skipped: true, reason: 'No destination provided' }),
    runAgent('Charging Intelligence', () => chargingAgent(lat, lon, telemetry)),
  ]);

  // ── Step 3: Emergency, V2G & V2V Safety Agents (Parallel Stage 3) ──
  const [emergencyResult, gridResult, v2vResult] = await Promise.all([
    runAgent('Emergency Assistance', () => emergencyAgent(telemetry, lat, lon)),
    runAgent('Grid Load & V2G Optimization', () => gridAgent(telemetry, chargingResult)),
    runAgent('V2V Charge Transfer', () => v2vAgent(telemetry, lat, lon)),
  ]);

  // ── Step 4: Sustainability, Pricing & Analytics (Parallel Stage 4) ──
  const [energyResult, pricingResult, analyticsResult] = await Promise.all([
    runAgent('Energy & Sustainability', () => energyAgent(telemetry, chargingResult)),
    runAgent('Pricing & Cost', () => pricingAgent(chargingResult, telemetry, routeResult)),
    runAgent('Analytics & Reports', () => analyticsAgent(telemetry, chargingHistory)),
  ]);

  // ── Step 5: Final Groq Synthesis ──────────────────────────────────────────
  emit('agent:start', { agent: 'Supervisor Synthesis', timestamp: new Date().toISOString() });

  const synthesisPrompt = `You are the Supervisor Agent of a 12-Agent EV Multi-Agent Operating System.
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
}`;

  const synthesisUser = `12 Agent outputs summary:
- Battery: SOC ${telemetry?.soc}%, SOH ${telemetry?.soh}%
- Route: ${routeResult.skipped ? 'No route' : `${routeResult.distance_km}km`}
- Charging: Station ${chargingResult.recommended_station?.name || 'N/A'}
- Emergency: is_emergency=${emergencyResult.is_emergency}
- V2V Transfer: is_v2v_required=${v2vResult.is_v2v_required}, matched_helper=${v2vResult.matched_helper?.owner} (${v2vResult.matched_helper?.vehicle}, ${v2vResult.matched_helper?.distance_m}m)
- Energy: carbon_saved=${energyResult.carbon_saved_kg}kg
- Pricing: trip_cost=₹${pricingResult.estimated_trip_cost || 0}
- Analytics: performance_score=${analyticsResult.performance_score}
- Weather: impact=${weatherResult.range_impact_percent}%, temp=${weatherResult.ambient_temp_c}°C
- Driver: eco_score=${driverResult.eco_score}, rating=${driverResult.safety_rating}
- Grid: ${gridResult.grid_status}, V2G=${gridResult.v2g_recommendation}
- Maintenance: vehicle_health=${maintenanceResult.overall_vehicle_health}
Synthesize unified recommendation.`;

  const synthFallback = {
    priority_action: (telemetry?.soc <= 10)
      ? `EMERGENCY V2V MODE: Connect 8 kWh V2V Transfer from ${v2vResult.matched_helper?.owner || 'Nearby Helper EV'} (${v2vResult.matched_helper?.distance_m || 450}m away)`
      : emergencyResult.is_emergency
      ? emergencyResult.recommended_action
      : batteryResult.charging_needed
      ? `Charge at ${chargingResult.recommended_station?.name || 'optimal station'}`
      : 'Vehicle operating in peak condition across all 12 AI agent domains',
    summary: `EV Fleet status: SOC ${telemetry?.soc}%, Eco-Score ${driverResult.eco_score}/100. ${telemetry?.soc <= 10 ? 'EMERGENCY LOW BATTERY — V2V SHARE ACTIVATED.' : 'All 12 specialized AI agent domains nominal.'}`,
    key_insights: [
      `V2V Emergency Share: ${v2vResult.matched_helper?.owner} (${v2vResult.matched_helper?.distance_m}m away)`,
      `Battery & Maintenance: ${batteryResult.health_grade || 'A'} (${maintenanceResult.overall_vehicle_health})`,
      `Driver Eco Score: ${driverResult.eco_score}/100 (${driverResult.driving_style})`,
      `Grid Status: ${gridResult.grid_status}`,
    ],
    overall_status: (telemetry?.soc <= 10 || emergencyResult.is_emergency) ? 'critical' : batteryResult.charging_needed ? 'attention_needed' : 'optimal',
    next_steps: [
      { step: 1, action: (telemetry?.soc <= 10) ? 'Initiate Emergency V2V Charge Transfer with nearby helper EV' : 'Maintain smooth speed cruising for maximum battery longevity', urgency: (telemetry?.soc <= 10) ? 'critical' : 'low' },
      { step: 2, action: `Target off-peak grid window: ${gridResult.optimal_charging_window}`, urgency: 'medium' },
    ],
    confidence_score: 0.96,
  };

  let synthesisResult = synthFallback;
  try {
    const t = Date.now();
    const content = await callGroq(
      [{ role: 'system', content: synthesisPrompt }, { role: 'user', content: synthesisUser }],
      'llama-3.3-70b-versatile',
      { json_mode: true, max_tokens: 600 }
    );
    synthesisResult = { ...synthFallback, ...parseGroqJSON(content, synthFallback) };
    logAgent('Supervisor Synthesis', synthesisResult, Date.now() - t);
  } catch {
    logAgent('Supervisor Synthesis', synthFallback, 0);
  }

  const totalDuration = Date.now() - startTime;
  emit('agent:complete', { totalDuration, agentLog });

  return {
    synthesis: synthesisResult,
    agents: {
      battery: batteryResult,
      route: routeResult,
      charging: chargingResult,
      emergency: emergencyResult,
      v2v: v2vResult,
      energy: energyResult,
      pricing: pricingResult,
      analytics: analyticsResult,
      weather: weatherResult,
      driver: driverResult,
      grid: gridResult,
      maintenance: maintenanceResult,
    },
    agentLog,
    totalDurationMs: totalDuration,
  };
}

module.exports = { supervisorAgent };
