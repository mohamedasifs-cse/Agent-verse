const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * ENERGY & SUSTAINABILITY AGENT
 * Calculates carbon savings vs petrol equivalent and scores green charging options.
 */
async function energyAgent(telemetry, chargingData) {
  // Carbon calculation: avg petrol car emits ~120g CO2/km
  // EV grid average: ~50g CO2/km (varies by grid mix)
  const distanceDriven = telemetry.totalDistanceKm || 0;
  const carbonSavedKg = +((distanceDriven * (120 - 50)) / 1000).toFixed(2);
  const treesEquivalent = +(carbonSavedKg / 21.77).toFixed(2); // avg tree absorbs 21.77 kg CO2/year

  const greenStations = (chargingData?.all_candidates_full || []).filter(s => s.is_green);

  const systemPrompt = `You are an Energy & Sustainability Agent for an EV operating system.
Analyze energy usage and sustainability metrics. Return ONLY a JSON object:
{
  "carbon_saved_kg": number,
  "trees_equivalent": number,
  "sustainability_score": number (0-100),
  "grid_carbon_intensity": "low|medium|high",
  "green_recommendation": string,
  "green_stations": [{ "name": string, "reason": string }],
  "renewable_percentage_estimate": number,
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `Vehicle stats: ${JSON.stringify(telemetry)}
Carbon saved vs petrol: ${carbonSavedKg} kg (${treesEquivalent} trees/year equivalent)
Green-flagged stations nearby: ${greenStations.length}
Station data: ${JSON.stringify(greenStations.slice(0, 3))}
Provide sustainability assessment.`;

  const fallback = {
    carbon_saved_kg: carbonSavedKg,
    trees_equivalent: treesEquivalent,
    sustainability_score: Math.min(100, Math.round(50 + carbonSavedKg * 0.5)),
    grid_carbon_intensity: 'medium',
    green_recommendation: greenStations.length > 0
      ? `Prefer ${greenStations[0].name} for greener charging`
      : 'Consider charging during off-peak hours for lower grid carbon intensity',
    green_stations: greenStations.slice(0, 3).map(s => ({ name: s.name, reason: 'Solar/renewable flagged' })),
    renewable_percentage_estimate: 35,
    confidence_score: 0.72,
    reasoning: `Based on ${distanceDriven.toFixed(0)} km driven, saved ${carbonSavedKg} kg CO2 vs petrol.`,
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.1-8b-instant',
      { json_mode: true, max_tokens: 500 }
    );
    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch {
    return fallback;
  }
}

module.exports = { energyAgent };
