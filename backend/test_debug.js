require('dotenv').config();
const { supervisorAgent } = require('./agents/supervisorAgent');

async function main() {
  try {
    const result = await supervisorAgent({
      telemetry: {
        soc: 65, soh: 92, temperatureC: 28, temperatureStatus: 'normal',
        estimatedRangeKm: 320, mode: 'idle', speedKmh: 0,
        totalDistanceKm: 120, totalEnergyChargedKwh: 45
      },
      origin: { lat: 37.7749, lon: -122.4194 },
      destination: { lat: 37.8715, lon: -122.2730 },
      chargingHistory: []
    });
    console.log('SUCCESS:', result.synthesis?.priority_action);
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
}
main();
