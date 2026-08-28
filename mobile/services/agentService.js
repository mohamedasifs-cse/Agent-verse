import api from './api';

export const agentService = {
  /**
   * Run full multi-agent AI analysis via Supervisor Agent endpoint
   */
  async analyzeSystem({ telemetry, origin, destination, vehicleId, vehicleType, vehicleModel }) {
    try {
      const payload = {
        telemetry: telemetry || {
          soc: 75,
          soh: 92,
          temperatureC: 26,
          estimatedRangeKm: vehicleType === 'bike' ? 140 : 380,
          vehicleType: vehicleType || 'car',
          vehicleModel: vehicleModel || 'Porsche Taycan EV',
        },
        origin: origin || { lat: 37.7749, lon: -122.4194 },
        destination: destination || null,
        vehicleId: vehicleId || 'demo_v1',
        vehicleType: vehicleType || 'car',
        vehicleModel: vehicleModel || 'Porsche Taycan EV',
      };

      const res = await api.post('/analyze', payload);
      return res.data;
    } catch (error) {
      console.warn('[agentService] /analyze request failed, returning client fallback analysis:', error.message);
      return {
        success: false,
        summary: 'Agent analysis fallback: Maintain regular battery monitoring and check charging station availability ahead.',
        recommendations: [
          'Battery temperature is optimal at 25°C.',
          'Consider charging when SoC reaches 20%.',
        ],
        agents: {
          battery: { status: 'NORMAL', recommendation: 'Battery condition healthy. Optimal charge retention.' },
          charging: { status: 'RECOMMENDED', recommendation: 'ChargePoint SuperHub is 2.8 km away.' },
          route: { status: 'OPTIMAL', recommendation: 'Traffic clear on primary EV route.' },
          driver_safety: { status: 'ALERT', recommendation: 'Drive carefully and maintain safe follow distance.' },
        },
      };
    }
  },
};
