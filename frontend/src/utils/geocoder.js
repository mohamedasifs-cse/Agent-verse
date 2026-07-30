import axios from 'axios';

// Fast local dictionary for popular cities to ensure 0ms instant response without network dependency
const KNOWN_CITIES = {
  'chennai': { lat: 13.0827, lon: 80.2707, display_name: 'Chennai, Tamil Nadu, India' },
  'bengaluru': { lat: 12.9716, lon: 77.5946, display_name: 'Bengaluru, Karnataka, India' },
  'bangalore': { lat: 12.9716, lon: 77.5946, display_name: 'Bengaluru, Karnataka, India' },
  'mumbai': { lat: 19.0760, lon: 72.8777, display_name: 'Mumbai, Maharashtra, India' },
  'delhi': { lat: 28.6139, lon: 77.2090, display_name: 'New Delhi, Delhi, India' },
  'new delhi': { lat: 28.6139, lon: 77.2090, display_name: 'New Delhi, Delhi, India' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, display_name: 'Hyderabad, Telangana, India' },
  'kochi': { lat: 9.9312, lon: 76.2673, display_name: 'Kochi, Kerala, India' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, display_name: 'Coimbatore, Tamil Nadu, India' },
  'madurai': { lat: 9.9252, lon: 78.1198, display_name: 'Madurai, Tamil Nadu, India' },
  'tirunelveli': { lat: 8.7139, lon: 77.7567, display_name: 'Tirunelveli, Tamil Nadu, India' },
  'trichy': { lat: 10.7905, lon: 78.7047, display_name: 'Tiruchirappalli, Tamil Nadu, India' },
  'salem': { lat: 11.6643, lon: 78.1460, display_name: 'Salem, Tamil Nadu, India' },
  'pune': { lat: 18.5204, lon: 73.8567, display_name: 'Pune, Maharashtra, India' },
  'kolkata': { lat: 22.5726, lon: 88.3639, display_name: 'Kolkata, West Bengal, India' },
  'san francisco': { lat: 37.7749, lon: -122.4194, display_name: 'San Francisco, California, USA' },
  'new york': { lat: 40.7128, lon: -74.0060, display_name: 'New York City, NY, USA' },
  'london': { lat: 51.5074, lon: -0.1278, display_name: 'London, United Kingdom' },
};

/**
 * Forward geocode a place name → { lat, lon, display_name }
 * Robust multi-tier resolution: Fast City Dict → Nominatim (with UA) → Photon Fallback
 */
export async function geocode(query) {
  if (!query || !query.trim()) throw new Error('Please enter a location name');
  const clean = query.trim().toLowerCase();

  // 1. Instant local dictionary lookup (0ms response, immune to network timeouts)
  if (KNOWN_CITIES[clean]) {
    return KNOWN_CITIES[clean];
  }
  for (const [key, val] of Object.entries(KNOWN_CITIES)) {
    if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
      return val;
    }
  }

  // 2. Primary API: Nominatim with User-Agent header (required by OSM policy) & increased timeout
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 1 },
      headers: {
        'User-Agent': 'EVMultiagentFleetOS/2.0 (contact@evmultiagent.app)',
        'Accept-Language': 'en',
      },
      timeout: 15000,
    });
    if (res.data && res.data.length > 0) {
      const { lat, lon, display_name } = res.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
    }
  } catch (err) {
    console.warn('[Geocoder] Nominatim primary query failed/timed out, switching to Photon API:', err.message);
  }

  // 3. Fallback API: Photon Search Engine (Komoot OSM)
  try {
    const res = await axios.get('https://photon.komoot.io/api/', {
      params: { q: query, limit: 1 },
      timeout: 10000,
    });
    if (res.data?.features?.length > 0) {
      const feat = res.data.features[0];
      const [lon, lat] = feat.geometry.coordinates;
      const props = feat.properties;
      const display_name = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ');
      return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
    }
  } catch (err) {
    console.warn('[Geocoder] Photon fallback failed:', err.message);
  }

  // 4. Secondary partial city dictionary check
  for (const [key, val] of Object.entries(KNOWN_CITIES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  throw new Error(`Could not find "${query}". Please check spelling or try a major city name.`);
}

/**
 * Reverse geocode { lat, lon } → human-readable address string
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json' },
      headers: {
        'User-Agent': 'EVMultiagentFleetOS/2.0 (contact@evmultiagent.app)',
        'Accept-Language': 'en',
      },
      timeout: 12000,
    });
    if (res.data?.display_name) {
      return res.data.display_name;
    }
  } catch (err) {
    console.warn('[Geocoder] Nominatim reverse geocode failed, trying Photon fallback:', err.message);
  }

  try {
    const res = await axios.get('https://photon.komoot.io/reverse', {
      params: { lat, lon },
      timeout: 10000,
    });
    if (res.data?.features?.length > 0) {
      const props = res.data.features[0].properties;
      return [props.name, props.city, props.country].filter(Boolean).join(', ');
    }
  } catch (err) {
    console.warn('[Geocoder] Photon reverse geocode failed:', err.message);
  }

  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
