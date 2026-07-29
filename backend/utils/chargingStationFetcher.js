const axios = require('axios');
const { roadDistanceKm } = require('./distanceCalculator');

const OCM_BASE = 'https://api.openchargemap.io/v3/poi';

/**
 * Fetch real charging stations from OpenChargeMap near given coordinates.
 * Enriches each station with road-corrected distance and simulated availability & pricing in Indian Rupees (₹).
 */
async function fetchNearbyStations(lat, lon, radiusKm = 20, maxResults = 10) {
  try {
    const res = await axios.get(OCM_BASE, {
      params: {
        key: process.env.OCM_API_KEY,
        latitude: lat,
        longitude: lon,
        distance: radiusKm,
        distanceunit: 'km',
        maxresults: maxResults,
        compact: true,
        verbose: false,
        output: 'json',
      },
      timeout: 10000,
    });

    return res.data.map(station => {
      const sLat = station.AddressInfo?.Latitude ?? lat;
      const sLon = station.AddressInfo?.Longitude ?? lon;
      const dist = roadDistanceKm(lat, lon, sLat, sLon);

      // Simulate availability (weighted random — most stations have some free bays)
      const totalBays = station.NumberOfPoints || 2;
      const availableBays = Math.max(0, totalBays - Math.floor(Math.random() * (totalBays + 1)));
      const queueLength = availableBays === 0 ? Math.floor(Math.random() * 4) : 0;

      // Simulate pricing in Indian Rupees (₹/kWh) — DC fast chargers cost more
      const connections = station.Connections || [];
      const maxPowerKw = connections.reduce((m, c) => Math.max(m, c.PowerKW || 0), 7.4);
      const pricePerKwh = maxPowerKw >= 50 ? +(24.0 + Math.random() * 8.0).toFixed(1)   // ₹24-₹32 for DC Fast
                        : maxPowerKw >= 22 ? +(18.0 + Math.random() * 6.0).toFixed(1)   // ₹18-₹24 for AC Fast
                        : +(12.0 + Math.random() * 6.0).toFixed(1);                     // ₹12-₹18 for AC Slow

      return {
        id: station.ID,
        name: station.AddressInfo?.Title || 'Unknown Station',
        address: station.AddressInfo?.AddressLine1 || '',
        lat: sLat,
        lon: sLon,
        distance_km: +dist.toFixed(2),
        max_power_kw: maxPowerKw,
        total_bays: totalBays,
        available_bays: availableBays,
        queue_length: queueLength,
        price_per_kwh: pricePerKwh, // In INR (₹)
        connector_types: connections.map(c => c.ConnectionType?.Title || 'Unknown').filter(Boolean),
        is_operational: station.StatusType?.IsOperational ?? true,
        is_green: !!(station.OperatorInfo?.WebsiteURL?.toLowerCase().includes('green') ||
                     station.AddressInfo?.Title?.toLowerCase().includes('solar') ||
                     Math.random() < 0.2), // 20% heuristic green flag
      };
    }).filter(s => s.is_operational);
  } catch (err) {
    console.error('[ChargingStationFetcher] OCM API error:', err.message);
    return [];
  }
}

module.exports = { fetchNearbyStations };
