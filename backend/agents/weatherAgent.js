const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * WEATHER & CLIMATE INTELLIGENCE AGENT
 * Analyzes ambient climate, wind velocity, thermal load, and impact on EV range.
 */
async function weatherAgent(telemetry, origin = null) {
  const tempC = telemetry?.temperatureC ?? 25;
  const speed = telemetry?.speedKmh ?? 60;

  // Rule-based fallback calculation
  const thermalHvacDrain = tempC > 35 ? (tempC - 35) * 1.5 : tempC < 10 ? (10 - tempC) * 2.0 : 0;
  const windPenaltyPercent = +(speed > 90 ? (speed - 90) * 0.25 : 0).toFixed(1);
  const rangeImpactPercent = +(thermalHvacDrain + windPenaltyPercent).toFixed(1);

  const fallback = {
    ambient_temp_c: tempC,
    weather_condition: tempC > 35 ? 'Extreme Heat / Tropical' : tempC < 5 ? 'Cold Front' : 'Clear / Optimal',
    hvac_power_kw: +(thermalHvacDrain * 0.1).toFixed(1),
    range_impact_percent: rangeImpactPercent,
    recommended_cabin_temp_c: 22,
    advice: tempC > 35 ? 'Pre-cool vehicle while plugged in to preserve drive range.' : 'Optimal climate conditions for peak EV efficiency.',
    confidence_score: 0.92,
  };

  const systemPrompt = `You are the Weather & Climate Intelligence Agent for an EV.
Analyze ambient temperature (${tempC}°C) and vehicle speed (${speed} km/h).
Calculate HVAC thermal energy impact and cabin climate optimization advice.
Return JSON:
{
  "ambient_temp_c": number,
  "weather_condition": string,
  "hvac_power_kw": number,
  "range_impact_percent": number,
  "recommended_cabin_temp_c": number,
  "advice": string,
  "confidence_score": number (0-1)
}`;

  try {
    const content = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Telemetry: temp=${tempC}°C, speed=${speed}km/h` },
    ], 'llama-3.3-70b-versatile', { json_mode: true, max_tokens: 300 });

    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch (err) {
    console.warn('[WeatherAgent] Groq call failed, using rule-based fallback:', err.message);
    return fallback;
  }
}

module.exports = { weatherAgent };
