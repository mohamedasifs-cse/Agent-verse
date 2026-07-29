const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * BATTERY INTELLIGENCE AGENT
 * Analyzes real-time telemetry and returns structured battery health assessment.
 */
async function batteryAgent(telemetry) {
  const systemPrompt = `You are a Battery Intelligence Agent for an EV operating system.
Analyze the provided battery telemetry and return ONLY a JSON object with this exact schema:
{
  "soc_percent": number,
  "soh_percent": number,
  "estimated_range_km": number,
  "temperature_status": "normal|warm|cold|critical",
  "charging_needed": boolean,
  "urgency": "none|low|medium|high|critical",
  "health_grade": "A|B|C|D|F",
  "recommendations": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `Battery telemetry: ${JSON.stringify(telemetry)}
Assess battery health, determine if charging is needed, and provide recommendations.`;

  const fallback = {
    soc_percent: telemetry.soc,
    soh_percent: telemetry.soh,
    estimated_range_km: telemetry.estimatedRangeKm,
    temperature_status: telemetry.temperatureStatus,
    charging_needed: telemetry.soc < 20,
    urgency: telemetry.soc < 10 ? 'critical' : telemetry.soc < 20 ? 'high' : 'none',
    health_grade: telemetry.soh > 90 ? 'A' : telemetry.soh > 80 ? 'B' : 'C',
    recommendations: ['Monitor battery temperature', 'Charge when below 20%'],
    confidence_score: 0.6,
    reasoning: 'Fallback assessment based on raw telemetry values.',
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.3-70b-versatile',
      { json_mode: true, max_tokens: 512 }
    );
    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch {
    return fallback;
  }
}

module.exports = { batteryAgent };
