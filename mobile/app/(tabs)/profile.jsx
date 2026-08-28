import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/VehicleContext';
import { useJourneyContext } from '../../context/JourneyContext';
import { chargingService } from '../../services/chargingService';
import { API_BASE_URL } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { vehicleName, vehicleType, selectedConfig, soc, soh } = useVehicle();
  const { arrivalRadiusMeters, setArrivalRadiusMeters } = useJourneyContext();

  const [history, setHistory] = useState([]);
  const [radiusInput, setRadiusInput] = useState(String(arrivalRadiusMeters));

  useEffect(() => {
    loadChargingHistory();
  }, [user]);

  const loadChargingHistory = async () => {
    try {
      const records = await chargingService.getChargingHistory(user?.vehicleId || 'demo_v1');
      setHistory(records);
    } catch (e) {
      console.warn('[Profile] History load error:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleSaveRadius = () => {
    const val = parseInt(radiusInput, 10);
    if (!isNaN(val) && val > 0) {
      setArrivalRadiusMeters(val);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {vehicleType === 'bike' ? '🛵' : '🏎️'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.vehicleName || vehicleName}</Text>
            <Text style={styles.userRole}>
              Registered {vehicleType === 'bike' ? 'Electric Bike / Scooter' : 'Electric Car'} Profile
            </Text>
            <Text style={styles.userId}>ID: {user?.userId || 'demo'}</Text>
          </View>
        </View>

        {/* Selected EV Specs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ VEHICLE SPECIFICATIONS</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Model Name</Text>
            <Text style={styles.specVal}>{selectedConfig.name}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValYellow}>{selectedConfig.type.toUpperCase()}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Battery Capacity</Text>
            <Text style={styles.specVal}>{selectedConfig.batteryCapacity} kWh</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Current SoC / SoH</Text>
            <Text style={styles.specValCyan}>{soc}% / {soh}%</Text>
          </View>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push('/vehicle/select')}
          >
            <Text style={styles.switchBtnText}>SWITCH OR SELECT VEHICLE ➔</Text>
          </TouchableOpacity>
        </View>

        {/* GPS Radius Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ GPS ARRIVAL SETTINGS</Text>
          <Text style={styles.settingDesc}>
            Configure the arrival detection radius (in meters) to trigger station arrival alerts.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.radiusInput}
              value={radiusInput}
              onChangeText={setRadiusInput}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRadius}>
              <Text style={styles.saveBtnText}>SAVE RADIUS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.apiInfo}>Connected Backend: {API_BASE_URL}</Text>
        </View>

        {/* Charging History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜 CHARGING HISTORY</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistory}>No recorded charging sessions yet.</Text>
          ) : (
            history.map((item, idx) => (
              <View key={item.id || idx} style={styles.historyItem}>
                <Text style={styles.hStation}>{item.stationName || 'ChargePoint Hub'}</Text>
                <Text style={styles.hDetail}>
                  {item.energyKwh || 18.5} kWh · Cost: ${item.cost || 6.5}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>LOGOUT FROM MOBILE OS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  userCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 0, 0.25)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(223, 255, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  userRole: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },
  userId: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#DFFF00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specLabel: { color: '#71717A', fontSize: 12 },
  specVal: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  specValYellow: { color: '#DFFF00', fontSize: 12, fontWeight: '800' },
  specValCyan: { color: '#00F0FF', fontSize: 12, fontWeight: '800' },
  switchBtn: {
    backgroundColor: 'rgba(223, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#DFFF00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  switchBtnText: { color: '#DFFF00', fontSize: 11, fontWeight: '900' },
  settingDesc: { color: '#A1A1AA', fontSize: 11, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  radiusInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 90,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: { color: '#080805', fontSize: 11, fontWeight: '900' },
  apiInfo: { color: '#52525B', fontSize: 10, marginTop: 4 },
  noHistory: { color: '#71717A', fontSize: 12, fontStyle: 'italic' },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  hStation: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  hDetail: { color: '#A1A1AA', fontSize: 11, marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
