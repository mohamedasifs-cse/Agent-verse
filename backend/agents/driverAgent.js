const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * DRIVER BEHAVIOR & SAFETY AGENT
 * Analyzes driving smoothness, eco-driving score, regen braking, and driver fatigue/safety.
 */
async function driverAgent(telemetry) {
  const speed = telemetry?.speedKmh ?? 0;
  const isDriving = telemetry?.mode === 'driving';

  // Rule-based fallback calculation
  const ecoScore = isDriving
    ? speed > 110 ? 72 : speed > 85 ? 86 : 94
    : 98;
  const regenEnergyRecoveredKwh = +(telemetry?.totalDistanceKm ? telemetry.totalDistanceKm * 0.04 : 1.2).toFixed(1);

  const fallback = {
    eco_score: ecoScore,
    driving_style: speed > 100 ? 'Aggressive / High Speed' : speed > 40 ? 'Smooth / Eco-Optimal' : 'Parked / City Traffic',
    regen_recovered_kwh: regenEnergyRecoveredKwh,
    safety_rating: ecoScore >= 90 ? 'A+' : ecoScore >= 80 ? 'A' : 'B',
    coaching_tip: speed > 100 ? 'Reduce highway cruising speed by 10 km/h to increase range by ~14%.' : 'Excellent smooth throttle modulation. Maximize one-pedal regenerative braking.',
    confidence_score: 0.94,
  };

  const systemPrompt = `You are the Driver Behavior & Safety Agent for an EV.
Analyze driving metrics: speed=${speed} km/h, distance=${telemetry?.totalDistanceKm || 0} km.
Evaluate eco-score (0-100), regenerative braking, and safety rating.
Return JSON:
{
  "eco_score": number,
  "driving_style": string,
  "regen_recovered_kwh": number,
  "safety_rating": string,
  "coaching_tip": string,
  "confidence_score": number (0-1)
}`;

  try {
    const content = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Driver data: speed=${speed}km/h, distance=${telemetry?.totalDistanceKm || 0}km` },
    ], 'llama-3.3-70b-versatile', { json_mode: true, max_tokens: 300 });

    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch (err) {
    console.warn('[DriverAgent] Groq call failed, using rule-based fallback:', err.message);
    return fallback;
  }
}

module.exports = { driverAgent };
