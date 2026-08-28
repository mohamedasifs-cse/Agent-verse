import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useVehicle } from '../context/VehicleContext';

export default function RegisterScreen() {
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleTypeState] = useState('car'); // 'car' | 'bike'
  const [batteryCapacity, setBatteryCapacity] = useState('75.0');
  const [maxRange, setMaxRange] = useState('450');
  const [pin, setPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { selectVehicle } = useVehicle();
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMsg('');
    if (!vehicleName.trim()) {
      setErrorMsg('Please enter vehicle model name.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    try {
      await register(vehicleName.trim(), vehicleType, pin, batteryCapacity, maxRange);
      selectVehicle(vehicleName.trim(), vehicleType);
      router.replace('/welcome');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>REGISTER NEW EV VEHICLE</Text>
        <Text style={styles.subtitle}>Add custom EV parameters to your fleet database</Text>

        <View style={styles.card}>
          <Text style={styles.label}>⚡ VEHICLE TYPE</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                vehicleType === 'car' ? styles.typeCardActive : null,
              ]}
              onPress={() => {
                setVehicleTypeState('car');
                setBatteryCapacity('75.0');
                setMaxRange('450');
              }}
            >
              <Text style={styles.typeIcon}>🚗</Text>
              <Text style={[styles.typeName, vehicleType === 'car' ? styles.typeNameActive : null]}>
                Electric Car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                vehicleType === 'bike' ? styles.typeCardActive : null,
              ]}
              onPress={() => {
                setVehicleTypeState('bike');
                setBatteryCapacity('4.0');
                setMaxRange('170');
              }}
            >
              <Text style={styles.typeIcon}>🛵</Text>
              <Text style={[styles.typeName, vehicleType === 'bike' ? styles.typeNameActive : null]}>
                Electric Bike
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>VEHICLE MODEL NAME</Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder="e.g. Custom Tesla Cybercab or Revolt RV400"
            placeholderTextColor="#71717A"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>BATTERY (kWh)</Text>
              <TextInput
                style={styles.input}
                value={batteryCapacity}
                onChangeText={setBatteryCapacity}
                keyboardType="numeric"
                placeholder="75.0"
                placeholderTextColor="#71717A"
              />
            </View>

            <View style={styles.halfCol}>
              <Text style={styles.label}>MAX RANGE (km)</Text>
              <TextInput
                style={styles.input}
                value={maxRange}
                onChangeText={setMaxRange}
                keyboardType="numeric"
                placeholder="450"
                placeholderTextColor="#71717A"
              />
            </View>
          </View>

          <Text style={styles.label}>🔑 SECURITY PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            placeholder="1234"
            placeholderTextColor="#71717A"
          />

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#080805" />
            ) : (
              <Text style={styles.submitBtnText}>REGISTER & CONNECT ➔</Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  title: {
    color: '#DFFF00',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 20,
  },
  label: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  typeCardActive: {
    backgroundColor: 'rgba(223, 255, 0, 0.12)',
    borderColor: '#DFFF00',
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeName: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  typeNameActive: {
    color: '#DFFF00',
    fontWeight: '900',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#DFFF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
  },
});
