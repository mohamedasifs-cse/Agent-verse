import api from './api';
import {
  calculateDistanceKm,
  distanceToPolylineKm,
  generatePolylineWaypoints,
  isValidCoordinate,
} from './routeService';

const normalizeStation = (st) => {
  const lat = Number(st.lat ?? st.latitude ?? 0);
  const lon = Number(st.lon ?? st.longitude ?? 0);
  const dist = Number(st.distanceKm ?? st.distance_km ?? 0);
  const power = Number(st.powerKw ?? st.max_power_kw ?? 150);
  const avail = Number(st.available ?? st.available_bays ?? 4);
  const total = Number(st.total ?? st.total_bays ?? 6);
  const price = st.pricePerKwh ?? (st.price_per_kwh ? `$${st.price_per_kwh}/kWh` : '$0.35/kWh');
  const connectors = st.connectors ?? st.connector_types ?? ['CCS2', 'Type 2'];

  return {
    ...st,
    id: st.id || `st_${lat}_${lon}`,
    name: st.name || 'EV Charging Station',
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    distanceKm: dist,
    distance_km: dist,
    powerKw: power,
    max_power_kw: power,
    available: avail,
    available_bays: avail,
    total: total,
    total_bays: total,
    pricePerKwh: price,
    connectors: connectors,
    isRecommended: Boolean(st.isRecommended || st.is_recommended || avail > 2),
  };
};

export const chargingService = {
  /**
   * Fetch nearby charging stations from backend
   */
  async getNearbyStations(lat = 37.7749, lon = -122.4194, radius = 25.0, max = 15) {
    try {
      console.log("STATION API URL:", `${api.defaults.baseURL}/stations`);
      console.log("STATION REQUEST LOCATION:", lat, lon);

      const res = await api.get('/stations', {
        params: { lat, lon, radius, max },
      });

      console.log("STATION API RESPONSE:", res.data);
      const rawStations = res.data?.stations || [];
      console.log("STATION COUNT:", rawStations.length);
      if (rawStations.length > 0) {
        console.log("FIRST STATION OBJECT:", rawStations[0]);
        console.log("STATION COORDINATES:", rawStations[0]?.lat, rawStations[0]?.lon);
      }

      return rawStations.map(normalizeStation);
    } catch (error) {
      console.warn('[chargingService] Backend station fetch error, using local fallback:', error.message);
      // Fallback charging stations generator
      const fallbackList = [
        {
          id: 'station_a',
          name: 'ChargePoint SuperHub',
          lat: lat + 0.02,
          lon: lon + 0.02,
          distanceKm: 2.8,
          powerKw: 150,
          connectors: ['CCS2', 'Type 2'],
          available: 4,
          total: 6,
          pricePerKwh: '$0.35',
          rating: 4.8,
          isRecommended: true,
        },
        {
          id: 'station_b',
          name: 'Tesla Supercharger Hub',
          lat: lat - 0.015,
          lon: lon + 0.03,
          distanceKm: 4.1,
          powerKw: 250,
          connectors: ['NACS', 'CCS2'],
          available: 8,
          total: 12,
          pricePerKwh: '$0.40',
          rating: 4.9,
          isRecommended: false,
        },
        {
          id: 'station_c',
          name: 'EVgo Fast Station',
          lat: lat + 0.035,
          lon: lon - 0.01,
          distanceKm: 5.5,
          powerKw: 100,
          connectors: ['CCS2', 'CHAdeMO'],
          available: 2,
          total: 4,
          pricePerKwh: '$0.32',
          rating: 4.5,
          isRecommended: false,
        },
      ];
      return fallbackList.map(normalizeStation);
    }
  },

  /**
   * Fetch and filter charging stations along the route corridor
   */
  async getStationsAlongRoute(sourceCoords, destCoords, polyline = [], corridorKm = 10) {
    if (!sourceCoords || !destCoords) return [];

    const ROUTE_CORRIDOR_KM = corridorKm || 10;

    const queryPoints = [];
    if (sourceCoords?.lat && sourceCoords?.lon) queryPoints.push(sourceCoords);
    if (polyline && polyline.length > 0) {
      const step = Math.max(1, Math.floor(polyline.length / 4));
      for (let i = step; i < polyline.length - 1; i += step) {
        const pt = polyline[i];
        queryPoints.push({
          lat: pt.latitude ?? pt.lat,
          lon: pt.longitude ?? pt.lon,
        });
      }
    }
    if (destCoords?.lat && destCoords?.lon) queryPoints.push(destCoords);

    let rawStations = [];
    for (const pt of queryPoints) {
      try {
        const fetched = await this.getNearbyStations(pt.lat, pt.lon, ROUTE_CORRIDOR_KM * 2, 10);
        rawStations = rawStations.concat(fetched);
      } catch (e) {}
    }

    const stationMap = new Map();
    for (const st of rawStations) {
      const key = st.id || `${st.lat?.toFixed(3)}_${st.lon?.toFixed(3)}`;
      if (!stationMap.has(key)) {
        stationMap.set(key, st);
      }
    }

    const uniqueStations = Array.from(stationMap.values());

    const routePolyline = polyline && polyline.length > 0
      ? polyline
      : generatePolylineWaypoints(sourceCoords, destCoords, 10);

    const filtered = [];
    for (const st of uniqueStations) {
      const stLat = parseFloat(st.lat);
      const stLon = parseFloat(st.lon);
      if (!isValidCoordinate(stLat, stLon)) continue;

      const distToRoute = distanceToPolylineKm(stLat, stLon, routePolyline);
      if (distToRoute <= ROUTE_CORRIDOR_KM) {
        const distFromSource = calculateDistanceKm(sourceCoords.lat, sourceCoords.lon, stLat, stLon);
        filtered.push({
          ...st,
          distanceToRouteKm: distToRoute,
          distanceKm: distFromSource,
        });
      }
    }

    filtered.sort((a, b) => {
      if (Math.abs(a.distanceToRouteKm - b.distanceToRouteKm) > 1) {
        return a.distanceToRouteKm - b.distanceToRouteKm;
      }
      return (b.available || 0) - (a.available || 0);
    });

    return filtered;
  },

  /**
   * Record a completed charging session on backend
   */
  async createChargingSession(sessionData) {
    try {
      const res = await api.post('/charging-session', sessionData);
      return res.data;
    } catch (error) {
      console.warn('[chargingService] Create session failed:', error.message);
      return { id: `session_${Date.now()}`, ...sessionData };
    }
  },

  /**
   * Fetch charging history for a vehicle
   */
  async getChargingHistory(vehicleId = 'demo_v1') {
    try {
      const res = await api.get(`/charging-history/${vehicleId}`);
      return res.data || [];
    } catch (error) {
      return [];
    }
  },
};
