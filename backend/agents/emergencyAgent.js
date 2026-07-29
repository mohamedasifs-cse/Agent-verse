const { callGroq, parseGroqJSON } = require('../utils/groqClient');
const { fetchNearbyStations } = require('../utils/chargingStationFetcher');

/**
 * EMERGENCY ASSISTANCE AGENT
 * Detects critical battery levels, finds V2V candidates and nearest real station.
 * This is the USP — runs on every request as a safety check.
 */

// Simulated nearby EVs willing to share energy (V2V)
function generateV2VCandidates(lat, lon) {
  const names = ['Tesla Model 3', 'Rivian R1T', 'Chevy Bolt', 'Hyundai Ioniq 5', 'Ford F-150 Lightning'];
  return Array.from({ length: 3 }, (_, i) => ({
    id: `v2v_${i + 1}`,
    vehicle: names[Math.floor(Math.random() * names.length)],
    owner: `EV Owner ${i + 1}`,
    lat: lat + (Math.random() - 0.5) * 0.05,
    lon: lon + (Math.random() - 0.5) * 0.05,
    available_soc: Math.floor(60 + Math.random() * 35),
    shareable_kwh: +(5 + Math.random() * 15).toFixed(1),
    distance_km: +(0.5 + Math.random() * 3).toFixed(2),
    willing_to_share: Math.random() > 0.3,
  })).filter(v => v.willing_to_share);
}

async function emergencyAgent(telemetry, lat, lon) {
  const isEmergency = telemetry.soc < 15;
  const urgencyLevel = telemetry.soc < 5 ? 'critical'
                     : telemetry.soc < 10 ? 'high'
                     : telemetry.soc < 15 ? 'medium'
                     : 'none';

  const v2vCandidates = isEmergency ? generateV2VCandidates(lat, lon) : [];
  const nearbyStations = isEmergency ? await fetchNearbyStations(lat, lon, 10, 3) : [];
  const nearestStation = nearbyStations[0] || null;

  if (!isEmergency) {
    return {
      is_emergency: false,
      urgency_level: 'none',
      recommended_action: 'Battery level is safe. No emergency action required.',
      nearest_charging_station: null,
      v2v_candidate_vehicle: null,
      v2v_candidates: [],
      confidence_score: 0.99,
      reasoning: `SOC at ${telemetry.soc}% — well above emergency threshold of 15%.`,
    };
  }

  const systemPrompt = `You are an Emergency Assistance Agent for an EV operating system.
The vehicle has a critically low battery. Analyze the situation and return ONLY a JSON object:
{
  "is_emergency": true,
  "urgency_level": "medium|high|critical",
  "recommended_action": string,
  "nearest_charging_station": { "name": string, "distance_km": number, "power_kw": number } | null,
  "v2v_candidate_vehicle": { "vehicle": string, "distance_km": number, "shareable_kwh": number } | null,
  "immediate_steps": [string],
  "confidence_score": number (0-1),
  "reasoning": string
}`;

  const userMsg = `EMERGENCY: Vehicle SOC at ${telemetry.soc}%, range: ${telemetry.estimatedRangeKm} km
Nearest charging station: ${nearestStation ? JSON.stringify(nearestStation) : 'None found'}
V2V candidates available: ${JSON.stringify(v2vCandidates)}
Provide emergency action plan.`;

  const fallback = {
    is_emergency: true,
    urgency_level: urgencyLevel,
    recommended_action: nearestStation
      ? `Drive immediately to ${nearestStation.name} (${nearestStation.distance_km} km away)`
      : v2vCandidates[0]
      ? `Request V2V energy transfer from ${v2vCandidates[0].vehicle} (${v2vCandidates[0].distance_km} km away)`
      : 'Pull over safely and call roadside assistance',
    nearest_charging_station: nearestStation ? {
      name: nearestStation.name,
      distance_km: nearestStation.distance_km,
      power_kw: nearestStation.max_power_kw,
    } : null,
    v2v_candidate_vehicle: v2vCandidates[0] || null,
    immediate_steps: ['Reduce speed to extend range', 'Turn off AC/heating', 'Navigate to nearest charger'],
    confidence_score: 0.85,
    reasoning: `Emergency detected at ${telemetry.soc}% SOC.`,
  };

  try {
    const content = await callGroq(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      'llama-3.3-70b-versatile',
      { json_mode: true, max_tokens: 600 }
    );
    return { ...fallback, ...parseGroqJSON(content, fallback), v2v_candidates: v2vCandidates };
  } catch {
    return { ...fallback, v2v_candidates: v2vCandidates };
  }
}

module.exports = { emergencyAgent };
