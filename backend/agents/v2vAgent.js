const { callGroq, parseGroqJSON } = require('../utils/groqClient');
const { roadDistanceKm } = require('../utils/distanceCalculator');

/**
 * VEHICLE-TO-VEHICLE (V2V) CHARGE TRANSFER AGENT
 * Detects low battery (SoC <= 10%), discovers nearby opted-in helper EVs,
 * matches optimal helper vehicle, handles request & secure power transfer.
 */

// Simulated pool of opted-in helper EVs in the network
const HELPER_EV_POOL = [
  { id: 'helper-ev-1', owner: 'Rajeswari S.', vehicle: 'TATA Nexon EV Max', distance_m: 450, soc: 88, max_export_kw: 22, cable: 'CCS2 Bidirectional V2V', rating: 4.9, location: '450m East (2 min away)' },
  { id: 'helper-ev-2', owner: 'Vikram R.', vehicle: 'Hyundai Ioniq 5', distance_m: 850, soc: 92, max_export_kw: 30, cable: 'CCS2 Bidirectional V2V', rating: 4.8, location: '850m North (4 min away)' },
  { id: 'helper-ev-3', owner: 'Ananya M.', vehicle: 'MG ZS EV', distance_m: 1400, soc: 79, max_export_kw: 15, cable: 'Type 2 V2V Adaptor', rating: 4.7, location: '1.4km West (6 min away)' },
  { id: 'helper-ev-4', owner: 'Karthik K.', vehicle: 'Mahindra XUV400 EV', distance_m: 2100, soc: 82, max_export_kw: 22, cable: 'CCS2 Bidirectional V2V', rating: 4.9, location: '2.1km South (9 min away)' },
];

async function v2vAgent(telemetry, lat = 37.7749, lon = -122.4194) {
  const soc = telemetry?.soc ?? 8;
  const isEmergencyV2V = soc <= 12;

  // Calculate energy needed to reach safety threshold (8 kWh default)
  const requiredEnergyKwh = 8.0;
  const estimatedRewardInr = 250; // ₹250 reward for helper

  // AI Matching Score calculation for each helper
  const candidateHelpers = HELPER_EV_POOL.map(helper => {
    // Score based on distance (closer = higher), SoC (higher = better), export kW
    const distScore = Math.max(0, 100 - (helper.distance_m / 30));
    const socScore = helper.soc;
    const matchScore = Math.round((distScore * 0.5) + (socScore * 0.4) + (helper.rating * 2));

    return {
      ...helper,
      match_score: Math.min(99, matchScore),
      transfer_energy_kwh: requiredEnergyKwh,
      estimated_reward_inr: estimatedRewardInr,
      estimated_transfer_mins: Math.round((requiredEnergyKwh / helper.max_export_kw) * 60),
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const bestHelper = candidateHelpers[0];

  const fallback = {
    is_v2v_required: isEmergencyV2V,
    battery_critical: soc <= 10,
    required_energy_kwh: requiredEnergyKwh,
    matched_helper: bestHelper,
    all_candidate_helpers: candidateHelpers,
    estimated_reward_inr: estimatedRewardInr,
    recommended_action: isEmergencyV2V
      ? `Emergency V2V Mode Active: Request 8 kWh from ${bestHelper.owner} (${bestHelper.vehicle}, ${bestHelper.distance_m}m away)`
      : 'Battery level sufficient — V2V Emergency Share available on standby',
    confidence_score: 0.96,
  };

  const systemPrompt = `You are the Vehicle-to-Vehicle (V2V) Charge Transfer AI Agent.
Analyze low battery state (SoC=${soc}%) and matched helper vehicle (${bestHelper.vehicle}, ${bestHelper.distance_m}m away).
Synthesize emergency V2V matching recommendation.
Return JSON:
{
  "is_v2v_required": boolean,
  "battery_critical": boolean,
  "required_energy_kwh": number,
  "matched_helper": object,
  "estimated_reward_inr": number,
  "recommended_action": string,
  "confidence_score": number (0-1)
}`;

  try {
    const content = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Battery SoC: ${soc}%, Matched Helper: ${bestHelper.owner} (${bestHelper.vehicle})` },
    ], 'llama-3.3-70b-versatile', { json_mode: true, max_tokens: 400 });

    return { ...fallback, ...parseGroqJSON(content, fallback) };
  } catch (err) {
    console.warn('[V2VAgent] Groq call failed, using rule-based fallback:', err.message);
    return fallback;
  }
}

module.exports = { v2vAgent, HELPER_EV_POOL };
