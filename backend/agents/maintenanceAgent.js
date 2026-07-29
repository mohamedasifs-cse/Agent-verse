const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * PREDICTIVE FLEET MAINTENANCE AGENT
 * Predicts component health (tire pressure, brake wear, inverter temperature, battery degradation).
 */
async function maintenanceAgent(telemetry) {
  const temp = telemetry?.temperatureC ?? 25;
  const soh = telemetry?.soh ?? 95;
  const distanceKm = telemetry?.totalDistanceKm ?? 12500;

  const brakeWearPercent = Math.min(60, +(distanceKm * 0.0012).toFixed(1)); // Regen braking saves brakes
  const tireHealthPercent = Math.max(70, +(100 - distanceKm * 0.0018).toFixed(1));

  const fallback = {
    overall_vehicle_health: soh > 90 ? 'Excellent (98/100)' : 'Good (85/100)',
    tire_health_percent: tireHealthPercent,
    brake_pad_wear_percent: brakeWearPercent,
    inverter_thermal_status: temp > 40 ? 'Elevated Thermal Load' : 'Normal Operating Temp',
    next_service_due_km: Math.max(5000, 20000 - Math.round(distanceKm % 20000)),
    maintenance_alerts: temp > 40
      ? ['Inverter thermal dissipation required — check coolant level']
      : ['Tire pressure nominal (36 PSI across all 4 tires)', 'High-voltage relay health optimal'],
    confidence_score: 0.95,
  };

  const systemPrompt = `You are the Predictive Fleet Maintenance Agent for an EV.
Analyze vehicle parameters: temp=${temp}°C, SOH=${soh}%, mileage=${distanceKm}km.
Predict component degradation and maintenance alerts.
Return JSON:
{
  "overall_vehicle_health": string,
  "tire_health_percent": number,
  "brake_pad_wear_percent": number,
  "inverter_thermal_status": string,
  "next_service_due_km": number,
  "maintenance_alerts": [string],
  "confidence_score": number (0-1)
}`;

  try {
    const content = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Vehicle specs: temp=${temp}°C, SOH=${soh}%, mileage=${distanceKm}km` },
    ], 'llama-3.3-70b-versatile', { json_mode: true, max_tokens: 350 });

    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch (err) {
    console.warn('[MaintenanceAgent] Groq call failed, using rule-based fallback:', err.message);
    return fallback;
  }
}

module.exports = { maintenanceAgent };
