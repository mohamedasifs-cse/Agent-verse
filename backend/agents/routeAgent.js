const { callGroq, parseGroqJSON } = require('../utils/groqClient');
const { roadDistanceKm, travelTimeMinutes } = require('../utils/distanceCalculator');

/**
 * ROUTE INTELLIGENCE AGENT
 * Calculates route feasibility using Haversine + road correction factor.
 */
async function routeAgent(origin, destination, batteryState) {
  const distKm = roadDistanceKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const travelMin = travelTimeMinutes(distKm);

  // Energy needed: ~20 kWh/100km average, adjusted for SOH
  const energyNeededKwh = (distKm / 100) * 20;
  const batteryCapacityKwh = 75 * (batteryState.soh / 100);
  const energyNeededPercent = +(energyNeededKwh / batteryCapacityKwh * 100).toFixed(1);
  const chargingStopRequired = batteryState.soc - energyNeededPercent < 10;

  const systemPrompt = `You are a Route Intelligence Agent for an EV operating system.
Given route data and battery state, return ONLY a JSON object:
{
  "distance_km": number,
  "estimated_energy_needed_percent": number,
  "travel_time_minutes": number,
  "charging_stop_required": boolean,
  "feasibility": "feasible|marginal|infeasible",
  "alternative_routes": [{"name": string, "distance_km": number, "energy_percent": number, "description": string}],
  "waypoint_suggestions": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `Route: ${JSON.stringify(origin)} → ${JSON.stringify(destination)}
Calculated distance: ${distKm.toFixed(1)} km, travel time: ${travelMin.toFixed(0)} min
Energy needed: ${energyNeededPercent}% of battery
Current SOC: ${batteryState.soc}%, SOH: ${batteryState.soh}%, Range: ${batteryState.estimatedRangeKm} km
Provide route analysis and alternatives.`;

  const fallback = {
    distance_km: +distKm.toFixed(1),
    estimated_energy_needed_percent: energyNeededPercent,
    travel_time_minutes: +travelMin.toFixed(0),
    charging_stop_required: chargingStopRequired,
    feasibility: chargingStopRequired ? 'marginal' : 'feasible',
    alternative_routes: [],
    waypoint_suggestions: chargingStopRequired ? ['Plan a charging stop at the midpoint'] : [],
    confidence_score: 0.75,
    reasoning: `Route is ${distKm.toFixed(1)} km requiring ~${energyNeededPercent}% battery.`,
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.3-70b-versatile',
      { json_mode: true, max_tokens: 600 }
    );
    const parsed = parseGroqJSON(content, fallback);
    // Always use calculated values for accuracy
    return { ...parsed, distance_km: fallback.distance_km, travel_time_minutes: fallback.travel_time_minutes };
  } catch {
    return fallback;
  }
}

module.exports = { routeAgent };
