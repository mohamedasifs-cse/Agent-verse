const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * GRID LOAD & RENEWABLE ENERGY OPTIMIZATION AGENT
 * Analyzes local electrical grid carbon intensity, V2G feasibility, solar availability, and off-peak tariffs.
 */
async function gridAgent(telemetry, chargingResult = null) {
  const currentHour = new Date().getHours();
  const isOffPeak = currentHour >= 22 || currentHour <= 6;
  const isSolarPeak = currentHour >= 10 && currentHour <= 16;

  const fallback = {
    grid_status: isSolarPeak ? 'High Solar Generation (Clean Grid)' : isOffPeak ? 'Off-Peak Tariff Window' : 'Peak Grid Demand',
    carbon_intensity_g_kwh: isSolarPeak ? 180 : isOffPeak ? 240 : 410,
    v2g_capable: true,
    v2g_recommendation: telemetry?.soc > 70 && !isOffPeak ? 'V2G discharge candidate: Earn revenue by supplying power to local microgrid.' : 'Hold charge for vehicle usage.',
    optimal_charging_window: '22:00 - 06:00 (Lowest Carbon & Cost)',
    grid_confidence: 0.91,
  };

  const systemPrompt = `You are the Grid Load & Renewable Energy Optimization Agent.
Analyze electrical grid carbon intensity and V2G (Vehicle-to-Grid) feasibility for EV SOC=${telemetry?.soc}%.
Return JSON:
{
  "grid_status": string,
  "carbon_intensity_g_kwh": number,
  "v2g_capable": boolean,
  "v2g_recommendation": string,
  "optimal_charging_window": string,
  "grid_confidence": number (0-1)
}`;

  try {
    const content = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `EV SOC: ${telemetry?.soc}%, hour: ${currentHour}` },
    ], 'llama-3.3-70b-versatile', { json_mode: true, max_tokens: 300 });

    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch (err) {
    console.warn('[GridAgent] Groq call failed, using rule-based fallback:', err.message);
    return fallback;
  }
}

module.exports = { gridAgent };
