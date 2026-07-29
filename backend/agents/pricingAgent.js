const { callGroq, parseGroqJSON } = require('../utils/groqClient');

/**
 * PRICING & COST AGENT
 * Compares costs across candidate stations and estimates trip cost in Indian Rupees (₹).
 */
async function pricingAgent(chargingData, batteryState, routeData) {
  const stations = chargingData?.all_candidates_full || [];
  const socNeeded = Math.max(0, 80 - batteryState.soc);
  const energyNeededKwh = (socNeeded / 100) * 75 * (batteryState.soh / 100);

  const costTable = stations.map(s => ({
    id: s.id,
    name: s.name,
    price_per_kwh: s.price_per_kwh, // in INR (₹)
    estimated_cost: +(s.price_per_kwh * energyNeededKwh).toFixed(2), // in INR (₹)
    max_power_kw: s.max_power_kw,
    distance_km: s.distance_km,
  })).sort((a, b) => a.estimated_cost - b.estimated_cost);

  const cheapest = costTable[0] || null;

  // Trip energy cost (full route)
  const routeEnergyKwh = routeData?.distance_km
    ? (routeData.distance_km / 100) * 20
    : 0;
  const avgPricePerKwh = stations.length
    ? stations.reduce((s, st) => s + st.price_per_kwh, 0) / stations.length
    : 22.0; // ₹22/kWh default
  const estimatedTripCost = +(routeEnergyKwh * avgPricePerKwh).toFixed(2); // ₹

  // Petrol cost equivalent in India (at ₹102/L, 8L/100km)
  const petrolCost = ((routeData?.distance_km || 0) / 100) * 8 * 102.0; // ₹

  const systemPrompt = `You are a Pricing & Cost Optimization Agent for an Indian EV operating system.
All currency must be evaluated in Indian Rupees (₹).
Analyze charging costs and return ONLY a JSON object:
{
  "cheapest_station": { "name": string, "price_per_kwh": number, "estimated_cost": number },
  "estimated_trip_cost": number,
  "cost_comparison_table": [{ "name": string, "price_per_kwh": number, "estimated_cost": number, "value_score": string }],
  "savings_vs_petrol": number,
  "cost_per_km": number,
  "recommendation": string,
  "confidence_score": number (0-1)
}`;

  const userMsg = `Energy needed to reach 80% SOC: ${energyNeededKwh.toFixed(1)} kWh
Cost comparison table (in INR ₹): ${JSON.stringify(costTable)}
Route distance: ${routeData?.distance_km || 0} km, estimated trip energy: ${routeEnergyKwh.toFixed(1)} kWh
Petrol equivalent cost in India (at ₹102/L, 8L/100km): ₹${petrolCost.toFixed(2)}`;

  const fallback = {
    cheapest_station: cheapest ? { name: cheapest.name, price_per_kwh: cheapest.price_per_kwh, estimated_cost: cheapest.estimated_cost } : null,
    estimated_trip_cost: estimatedTripCost,
    cost_comparison_table: costTable,
    savings_vs_petrol: +(petrolCost - estimatedTripCost).toFixed(2),
    cost_per_km: routeData?.distance_km ? +(estimatedTripCost / routeData.distance_km).toFixed(2) : 2.10,
    recommendation: cheapest ? `Use ${cheapest.name} to minimize charging cost at ₹${cheapest.price_per_kwh}/kWh` : 'No stations available for comparison',
    confidence_score: 0.85,
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

module.exports = { pricingAgent };
