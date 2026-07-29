require('dotenv').config();
const axios = require('axios');

async function main() {
  console.log('Hitting /api/analyze directly...');
  try {
    const res = await axios.post('http://localhost:5000/api/analyze', {
      telemetry: {
        soc: 65, soh: 92, temperatureC: 28, temperatureStatus: 'normal',
        estimatedRangeKm: 320, mode: 'idle', speedKmh: 0,
        totalDistanceKm: 120, totalEnergyChargedKwh: 45
      },
      origin: { lat: 37.7749, lon: -122.4194 },
      destination: { lat: 37.8715, lon: -122.2730 },
      vehicleId: null
    }, { timeout: 90000 });
    console.log('SUCCESS:', res.data.synthesis?.priority_action);
  } catch (e) {
    console.error('HTTP ERROR:', e.response?.status);
    console.error('BODY:', JSON.stringify(e.response?.data, null, 2));
    console.error('MSG:', e.message);
  }
}
main();
