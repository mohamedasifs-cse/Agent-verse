const { callGroq, parseGroqJSON } = require('../utils/groqClient');
const { fetchNearbyStations } = require('../utils/chargingStationFetcher');

/**
 * CHARGING INTELLIGENCE AGENT
 * Fetches real stations from OpenChargeMap, enriches with simulated data,
 * then uses Groq to recommend the best option.
 */
async function chargingAgent(lat, lon, batteryState) {
  const stations = await fetchNearbyStations(lat, lon, 25, 10);
  const top5 = stations.slice(0, 5);

  if (top5.length === 0) {
    return {
      recommended_station: null,
      all_candidates: [],
      estimated_wait_minutes: 0,
      estimated_charging_duration_minutes: 0,
      confidence_score: 0.3,
      reasoning: 'No charging stations found in the area. Try expanding search radius.',
    };
  }

  const systemPrompt = `You are a Charging Intelligence Agent for an EV operating system.
Given candidate charging stations and battery state, return ONLY a JSON object:
{
  "recommended_station": { "id": number, "name": string, "reason": string },
  "all_candidates": [{ "id": number, "name": string, "score": number, "pros": [string], "cons": [string] }],
  "estimated_wait_minutes": number,
  "estimated_charging_duration_minutes": number,
  "charging_strategy": "fast_charge|slow_charge|opportunity_charge",
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `Battery SOC: ${batteryState.soc}%, SOH: ${batteryState.soh}%
Target charge: 80% (optimal for battery health)
Candidate stations: ${JSON.stringify(top5, null, 2)}
Recommend the best station considering distance, power, availability, and cost.`;

  // Estimate charging duration for best station
  const bestByScore = top5.reduce((best, s) => {
    const score = (s.available_bays > 0 ? 30 : 0) + (s.max_power_kw / 10) - s.distance_km * 2 - s.price_per_kwh * 10;
    return score > (best.score ?? -Infinity) ? { ...s, score } : best;
  }, {});

  const targetSoc = 80;
  const socNeeded = Math.max(0, targetSoc - batteryState.soc);
  const energyNeededKwh = (socNeeded / 100) * 75 * (batteryState.soh / 100);
  const chargeDurationMin = bestByScore.max_power_kw
    ? +((energyNeededKwh / bestByScore.max_power_kw) * 60).toFixed(0)
    : 45;

  const fallback = {
    recommended_station: { id: bestByScore.id, name: bestByScore.name, reason: 'Best balance of distance, power, and availability' },
    all_candidates: top5.map(s => ({ id: s.id, name: s.name, score: 0.7, pros: [], cons: [] })),
    estimated_wait_minutes: bestByScore.queue_length * 20,
    estimated_charging_duration_minutes: chargeDurationMin,
    charging_strategy: bestByScore.max_power_kw >= 50 ? 'fast_charge' : 'slow_charge',
    confidence_score: 0.7,
    reasoning: `Recommended ${bestByScore.name} based on availability and power output.`,
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.3-70b-versatile',
      { json_mode: true, max_tokens: 700 }
    );
    const parsed = parseGroqJSON(content, fallback);
    return { ...parsed, all_candidates_full: top5 };
  } catch {
    return { ...fallback, all_candidates_full: top5 };
  }
}

module.exports = { chargingAgent };
