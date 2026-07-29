const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * ANALYTICS & REPORT AGENT
 * Aggregates historical data into actionable insights and maintenance recommendations.
 */
async function analyticsAgent(telemetry, chargingHistory = []) {
  // Build trend data from telemetry history (passed in or simulated)
  const sohTrend = telemetry.soh > 90 ? 'excellent'
                 : telemetry.soh > 80 ? 'good'
                 : telemetry.soh > 70 ? 'fair'
                 : 'poor';

  const avgChargingCost = chargingHistory.length
    ? (chargingHistory.reduce((s, h) => s + (h.cost || 0), 0) / chargingHistory.length).toFixed(2)
    : 0;

  const systemPrompt = `You are an Analytics & Report Agent for an EV operating system.
Generate a comprehensive vehicle health and usage report. Return ONLY a JSON object:
{
  "battery_health_trend": { "status": string, "soh_percent": number, "projected_degradation_per_year": number, "estimated_replacement_years": number },
  "charging_history_summary": { "total_sessions": number, "avg_cost_per_session": number, "preferred_charging_time": string, "total_energy_kwh": number },
  "maintenance_insights": [{ "item": string, "priority": "low|medium|high", "recommendation": string }],
  "performance_score": number (0-100),
  "efficiency_rating": string,
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `Current telemetry: ${JSON.stringify(telemetry)}
SOH trend: ${sohTrend}
Charging history (${chargingHistory.length} sessions): avg cost $${avgChargingCost}
Total distance: ${telemetry.totalDistanceKm} km
Total energy charged: ${telemetry.totalEnergyChargedKwh} kWh
Generate comprehensive analytics report.`;

  const fallback = {
    battery_health_trend: {
      status: sohTrend,
      soh_percent: telemetry.soh,
      projected_degradation_per_year: 2.5,
      estimated_replacement_years: Math.round((telemetry.soh - 70) / 2.5),
    },
    charging_history_summary: {
      total_sessions: chargingHistory.length,
      avg_cost_per_session: +avgChargingCost,
      preferred_charging_time: 'Off-peak (10pm-6am)',
      total_energy_kwh: telemetry.totalEnergyChargedKwh,
    },
    maintenance_insights: [
      { item: 'Battery Thermal Management', priority: telemetry.temperatureC > 40 ? 'high' : 'low', recommendation: 'Check cooling system' },
      { item: 'Charging Port', priority: 'low', recommendation: 'Clean contacts every 6 months' },
      { item: 'Tire Pressure', priority: 'medium', recommendation: 'Check monthly for optimal range' },
    ],
    performance_score: Math.round(telemetry.soh * 0.6 + (telemetry.soc / 100) * 40),
    efficiency_rating: telemetry.soh > 90 ? 'Excellent' : telemetry.soh > 80 ? 'Good' : 'Fair',
    confidence_score: 0.78,
    reasoning: `Analysis based on current SOH of ${telemetry.soh}% and ${telemetry.totalDistanceKm} km driven.`,
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.1-8b-instant',
      { json_mode: true, max_tokens: 700 }
    );
    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch {
    return fallback;
  }
}

module.exports = { analyticsAgent };
