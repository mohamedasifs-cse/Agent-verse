/**
 * ROUTE STATION CALCULATOR & BATTERY REST STOP PLANNER
 *
 * 1. Generates/samples EV charging hubs along the entire OSRM route from Origin to Destination.
 * 2. Calculates exact battery discharge curves and recommends the OPTIMAL NEXT REST & CHARGE STOP.
 */

// Preset realistic highway charging brands for India & Global routes
const HIGHWAY_CHARGER_BRANDS = [
  { name: 'Tata Power EZ Charge - Highway Plaza', power: 150, price: 22.5, amenities: ['☕ Coffee', '🚻 Restroom', '🍔 Dining'] },
  { name: 'Jio-bp pulse Superhub', power: 200, price: 24.0, amenities: ['☕ Cafe', '🚻 Washrooms', '📶 5G WiFi'] },
  { name: 'Zeon Charging - Express Stop', power: 120, price: 21.0, amenities: ['🏨 Motel', '☕ Coffee', '🚻 Restroom'] },
  { name: 'Shell Recharge - Energy Hub', power: 180, price: 23.5, amenities: ['🍔 Fast Food', '🚻 Clean Restrooms'] },
  { name: 'Statiq UltraFast Hub', power: 150, price: 20.0, amenities: ['☕ Lounge', '🚻 Restroom'] },
  { name: 'ChargeZone Highway Station', power: 240, price: 25.0, amenities: ['☕ Coffee', '🚻 Restroom', '🛒 Mart'] },
  { name: 'Relux Electric Charging Station', power: 120, price: 19.5, amenities: ['🚻 Restroom', '🥤 Refreshments'] },
  { name: 'ElectreeFi Highway Hub', power: 100, price: 18.5, amenities: ['☕ Tea & Coffee', '🚻 Restroom'] },
];

/**
 * Calculate road distance between two points in km (Haversine formula)
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate charging stations along the route polyline from start to finish
 */
export function generateRouteStations(routePoints, origin, destination, baseStations = []) {
  if (!routePoints || routePoints.length < 2) return baseStations;

  const totalPoints = routePoints.length;
  const stationsAlongRoute = [];

  // Calculate cumulative distance along polyline
  let totalKm = 0;
  const cumulativeDist = [0];
  for (let i = 1; i < totalPoints; i++) {
    const dist = getDistanceKm(routePoints[i - 1][0], routePoints[i - 1][1], routePoints[i][0], routePoints[i][1]);
    totalKm += dist;
    cumulativeDist.push(totalKm);
  }

  // Sample stations every ~35 km to 50 km along the route
  const intervalKm = totalKm > 300 ? 55 : totalKm > 150 ? 40 : 25;
  const numStops = Math.max(3, Math.floor(totalKm / intervalKm));

  for (let s = 1; s <= numStops; s++) {
    const targetDist = (s / (numStops + 1)) * totalKm;

    // Find polyline index closest to targetDist
    let pointIdx = 0;
    while (pointIdx < cumulativeDist.length - 1 && cumulativeDist[pointIdx] < targetDist) {
      pointIdx++;
    }

    const [lat, lon] = routePoints[pointIdx];
    // Add small realistic offset off the main highway (0.5 to 1.8 km)
    const offsetLat = lat + (Math.random() - 0.5) * 0.015;
    const offsetLon = lon + (Math.random() - 0.5) * 0.015;

    const brand = HIGHWAY_CHARGER_BRANDS[(s - 1) % HIGHWAY_CHARGER_BRANDS.length];
    const totalBays = Math.floor(Math.random() * 4) + 4; // 4 to 8 bays
    const availableBays = Math.floor(Math.random() * (totalBays - 1)) + 1; // At least 1 free bay

    stationsAlongRoute.push({
      id: `route-station-${s}-${Math.round(targetDist)}`,
      name: `${brand.name} @ Km ${Math.round(targetDist)}`,
      address: `Highway Km ${Math.round(targetDist)} (${Math.round(totalKm - targetDist)} km to destination)`,
      lat: offsetLat,
      lon: offsetLon,
      distanceFromOriginKm: Math.round(targetDist),
      distanceToDestKm: Math.round(totalKm - targetDist),
      max_power_kw: brand.power,
      total_bays: totalBays,
      available_bays: availableBays,
      queue_length: availableBays === 0 ? 1 : 0,
      price_per_kwh: brand.price,
      amenities: brand.amenities,
      is_operational: true,
      is_highway_hub: true,
      connector_types: ['CCS2 Fast Charger', 'Type 2 AC'],
    });
  }

  // Combine with any pre-existing nearby stations
  const combined = [...baseStations, ...stationsAlongRoute];

  // Remove duplicates by coordinates proximity
  const unique = [];
  combined.forEach(st => {
    const isDup = unique.some(u => Math.abs(u.lat - st.lat) < 0.01 && Math.abs(u.lon - st.lon) < 0.01);
    if (!isDup) unique.push(st);
  });

  return {
    allStations: unique,
    totalTripDistanceKm: Math.round(totalKm),
  };
}

/**
 * Calculates battery discharge & recommends the OPTIMAL NEXT REST & CHARGE STOP
 */
export function calculateNextRestStop(allStations, totalTripKm, currentSoc = 80, batteryCapacityKwh = 80) {
  if (!allStations || allStations.length === 0) return null;

  // EV Energy consumption ~0.18 kWh / km
  const consumptionKwhPerKm = 0.18;
  const maxRangeKm = Math.round((batteryCapacityKwh * (currentSoc / 100)) / consumptionKwhPerKm);

  // Critical battery threshold (stop when SoC drops to ~15% - 22%)
  const minSocReserve = 18; // Keep 18% reserve
  const maxSafeKm = Math.round(((currentSoc - minSocReserve) / 100) * batteryCapacityKwh / consumptionKwhPerKm);

  // Filter stations located before maxSafeKm
  const candidateStops = allStations
    .filter(st => st.distanceFromOriginKm && st.distanceFromOriginKm > 10)
    .map(st => {
      const distFromStart = st.distanceFromOriginKm;
      const socOnArrival = Math.max(2, Math.round(currentSoc - (distFromStart * consumptionKwhPerKm / batteryCapacityKwh) * 100));
      const score = (st.available_bays > 0 ? 40 : 0) + (st.max_power_kw / 5) - Math.abs(distFromStart - maxSafeKm) * 0.8;
      return { ...st, socOnArrival, score };
    })
    .sort((a, b) => b.score - a.score);

  const bestStop = candidateStops.length > 0 ? candidateStops[0] : allStations[0];

  // Calculate charge needed at the best stop to reach destination comfortably
  const distFromStopToDest = totalTripKm - (bestStop.distanceFromOriginKm || 50);
  const kwhToCompleteTrip = distFromStopToDest * consumptionKwhPerKm;
  const targetSocForDest = Math.min(90, Math.round(((kwhToCompleteTrip + 15) / batteryCapacityKwh) * 100));
  const socToGain = Math.max(10, targetSocForDest - (bestStop.socOnArrival || 15));
  const kwhToCharge = (socToGain / 100) * batteryCapacityKwh;
  const chargeTimeMins = Math.max(12, Math.round((kwhToCharge / (bestStop.max_power_kw || 150)) * 60));

  return {
    bestStop,
    currentSoc,
    maxRangeKm,
    maxSafeKm,
    totalTripKm,
    socOnArrival: bestStop.socOnArrival || 18,
    targetSocForDest,
    socToGain,
    chargeTimeMins,
    candidateStopsCount: candidateStops.length,
  };
}
