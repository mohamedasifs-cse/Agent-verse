/**
 * Haversine formula — returns straight-line distance in km between two lat/lng points
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Road-corrected distance (straight-line × 1.3 factor)
 */
function roadDistanceKm(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1.3;
}

/**
 * Estimated travel time in minutes given road distance and average speed
 */
function travelTimeMinutes(distanceKm, avgSpeedKmh = 60) {
  return (distanceKm / avgSpeedKmh) * 60;
}

module.exports = { haversineKm, roadDistanceKm, travelTimeMinutes };
