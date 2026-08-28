import axios from 'axios';

// Validate coordinates (-90 <= lat <= 90, -180 <= lon <= 180, not NaN)
export function isValidCoordinate(lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return false;
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon)) return false;
  return numLat >= -90 && numLat <= 90 && numLon >= -180 && numLon <= 180;
}

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) return 0;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Calculate estimated travel time in minutes based on distance & speed
export function calculateEtaMinutes(distanceKm, averageSpeedKmh = 45) {
  if (!distanceKm || distanceKm <= 0) return 0;
  const hours = distanceKm / averageSpeedKmh;
  return Math.round(hours * 60);
}

// Distance from point P to line segment AB in kilometers
export function distanceToSegmentKm(pLat, pLon, aLat, aLon, bLat, bLon) {
  const dAB = calculateDistanceKm(aLat, aLon, bLat, bLon);
  if (dAB === 0) return calculateDistanceKm(pLat, pLon, aLat, aLon);

  const t = Math.max(
    0,
    Math.min(
      1,
      ((pLat - aLat) * (bLat - aLat) + (pLon - aLon) * (bLon - aLon)) /
        (Math.pow(bLat - aLat, 2) + Math.pow(bLon - aLon, 2))
    )
  );

  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);
  return calculateDistanceKm(pLat, pLon, projLat, projLon);
}

// Minimum distance from a station point to route polyline
export function distanceToPolylineKm(pLat, pLon, polyline = []) {
  if (!polyline || polyline.length === 0) return 9999;
  if (polyline.length === 1) {
    const pt = polyline[0];
    const lat = pt.latitude ?? pt.lat ?? pt[0];
    const lon = pt.longitude ?? pt.lon ?? pt[1];
    return calculateDistanceKm(pLat, pLon, lat, lon);
  }

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const lat1 = p1.latitude ?? p1.lat ?? p1[0];
    const lon1 = p1.longitude ?? p1.lon ?? p1[1];
    const lat2 = p2.latitude ?? p2.lat ?? p2[0];
    const lon2 = p2.longitude ?? p2.lon ?? p2[1];

    const dist = distanceToSegmentKm(pLat, pLon, lat1, lon1, lat2, lon2);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return parseFloat(minDistance.toFixed(2));
}

// Generate intermediate polyline waypoints between source and destination
export function generatePolylineWaypoints(source, destination, numSteps = 10) {
  if (!isValidCoordinate(source?.lat, source?.lon) || !isValidCoordinate(destination?.lat, destination?.lon)) {
    return [];
  }
  const points = [];
  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    const lat = source.lat + (destination.lat - source.lat) * fraction;
    const lon = source.lon + (destination.lon - source.lon) * fraction;
    points.push({ latitude: parseFloat(lat.toFixed(5)), longitude: parseFloat(lon.toFixed(5)) });
  }
  return points;
}

// Simple Geocoding helper (nominatim / openstreetmap)
export async function geocodeAddress(query) {
  if (!query || !query.trim()) return null;
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query.trim(), format: 'json', limit: 1 },
      headers: { 'User-Agent': 'EV-Multi-Agent-OS-Mobile/1.0' },
      timeout: 5000,
    });
    if (res.data && res.data.length > 0) {
      const lat = parseFloat(res.data[0].lat);
      const lon = parseFloat(res.data[0].lon);
      if (isValidCoordinate(lat, lon)) {
        return {
          lat,
          lon,
          displayName: res.data[0].display_name,
        };
      }
    }
  } catch (e) {
    console.warn('[routeService] Geocoding failed:', e.message);
  }
  return null;
}

export const routeService = {
  isValidCoordinate,
  calculateDistanceKm,
  calculateEtaMinutes,
  distanceToSegmentKm,
  distanceToPolylineKm,
  generatePolylineWaypoints,
  geocodeAddress,
};
