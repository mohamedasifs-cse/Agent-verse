import * as SecureStore from 'expo-secure-store';
import api from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_session';

export const authService = {
  /**
   * Log in user using PIN & vehicle credentials
   */
  async login(vehicleName, pin, vehicleType = 'car') {
    if (!vehicleName || !vehicleName.trim()) {
      throw { message: 'Vehicle name/model is required' };
    }
    if (!pin || pin.length < 4) {
      throw { message: 'Security PIN must be at least 4 digits' };
    }

    try {
      // Fetch or register vehicle on backend
      let vehicleData = null;
      try {
        const res = await api.get(`/vehicles?userId=demo`);
        if (res.data && res.data.length > 0) {
          vehicleData = res.data.find(v => v.name?.toLowerCase() === vehicleName.trim().toLowerCase()) || res.data[0];
        }
      } catch (e) {
        console.warn('[AuthService] Fetch vehicles fallback:', e.message);
      }

      // Generate session object
      const token = `ev_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionUser = {
        userId: 'demo',
        vehicleName: vehicleName.trim(),
        vehicleType,
        pin,
        vehicleId: vehicleData?.id || 'demo_v1',
        loginTime: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(sessionUser));

      return { token, user: sessionUser };
    } catch (error) {
      throw error.message ? error : { message: 'Login failed due to a system error.' };
    }
  },

  /**
   * Register new EV vehicle profile
   */
  async register(vehicleName, vehicleType, pin, batteryCapacityKwh, maxRangeKm) {
    if (!vehicleName || !vehicleName.trim()) {
      throw { message: 'Vehicle model name is required.' };
    }
    if (!pin || pin.length < 4) {
      throw { message: 'PIN must be at least 4 digits.' };
    }

    try {
      const payload = {
        userId: 'demo',
        name: vehicleName.trim(),
        make: vehicleType === 'bike' ? 'Smart EV Bike' : 'Smart EV Car',
        model: vehicleName.trim(),
        vehicleType: vehicleType || 'car',
        batteryCapacityKwh: parseFloat(batteryCapacityKwh) || (vehicleType === 'bike' ? 4.0 : 75.0),
        maxRangeKm: parseFloat(maxRangeKm) || (vehicleType === 'bike' ? 150.0 : 450.0),
        lat: 37.7749,
        lon: -122.4194,
      };

      let createdVehicle = null;
      try {
        const res = await api.post('/vehicles', payload);
        createdVehicle = res.data;
      } catch (e) {
        console.warn('[AuthService] Register backend fallback:', e.message);
        createdVehicle = { id: `v_${Date.now()}`, ...payload };
      }

      const token = `ev_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionUser = {
        userId: 'demo',
        vehicleName: vehicleName.trim(),
        vehicleType: vehicleType || 'car',
        pin,
        vehicleId: createdVehicle.id,
        loginTime: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(sessionUser));

      return { token, user: sessionUser };
    } catch (error) {
      throw error.message ? error : { message: 'Registration failed.' };
    }
  },

  /**
   * Get current stored session
   */
  async getCurrentSession() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Log out user and clear secure store
   */
  async logout() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('[AuthService] Logout cleanup error:', e);
    }
  },
};
