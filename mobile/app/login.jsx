import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useVehicle } from '../context/VehicleContext';

const CAR_PRESETS = [
  'Porsche Taycan EV',
  'Tata Nexon EV',
  'Tata Punch EV',
  'Mahindra XUV400',
  'MG ZS EV',
];

const BIKE_PRESETS = [
  'Ola S1 Pro',
  'Ather 450X',
  'TVS iQube',
  'Bajaj Chetak',
  'Hero Vida V1',
];

export default function LoginScreen() {
  const [vehicleType, setVehicleTypeState] = useState('car'); // 'car' | 'bike'
  const [vehicleName, setVehicleName] = useState('Porsche Taycan EV');
  const [pin, setPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { selectVehicle } = useVehicle();
  const router = useRouter();

  const handleTypeChange = (type) => {
    setVehicleTypeState(type);
    if (type === 'car') {
      setVehicleName('Porsche Taycan EV');
    } else {
      setVehicleName('Ola S1 Pro');
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!vehicleName.trim()) {
      setErrorMsg('Please enter or select a vehicle model.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMsg('Please enter a valid 4-digit PIN (e.g. 1234).');
      return;
    }

    setLoading(true);
    try {
      await login(vehicleName.trim(), pin, vehicleType);
      selectVehicle(vehicleName.trim(), vehicleType);
      router.replace('/welcome');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const presets = vehicleType === 'car' ? CAR_PRESETS : BIKE_PRESETS;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.title}>EV Multi-Agent OS</Text>
          <Text style={styles.subtitle}>
            Connect your Electric Car or Scooter to start AI multi-agent telemetry
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.label}>⚡ SELECT VEHICLE TYPE</Text>
          <View style={styles.typeSelectorRow}>
            {/* Electric Car Option */}
            <TouchableOpacity
              style={[
                styles.typeCard,
                vehicleType === 'car' ? styles.typeCardActive : null,
              ]}
              onPress={() => handleTypeChange('car')}
            >
              <Text style={styles.typeIcon}>🚗</Text>
              <Text
                style={[
                  styles.typeName,
                  vehicleType === 'car' ? styles.typeNameActive : null,
                ]}
              >
                Electric Car
              </Text>
            </TouchableOpacity>

            {/* Electric Bike Option */}
            <TouchableOpacity
              style={[
                styles.typeCard,
                vehicleType === 'bike' ? styles.typeCardActive : null,
              ]}
              onPress={() => handleTypeChange('bike')}
            >
              <Text style={styles.typeIcon}>🛵</Text>
              <Text
                style={[
                  styles.typeName,
                  vehicleType === 'bike' ? styles.typeNameActive : null,
                ]}
              >
                Electric Bike
              </Text>
            </TouchableOpacity>
          </View>

          {/* Model Input */}
          <Text style={styles.label}>
            {vehicleType === 'car' ? '🚗' : '🛵'} VEHICLE MODEL
          </Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder={vehicleType === 'car' ? 'e.g. Porsche Taycan EV' : 'e.g. Ola S1 Pro'}
            placeholderTextColor="#71717A"
          />

          {/* Preset Buttons */}
          <View style={styles.presetContainer}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  vehicleName === preset ? styles.presetChipActive : null,
                ]}
                onPress={() => setVehicleName(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    vehicleName === preset ? styles.presetTextActive : null,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* PIN Input */}
          <Text style={styles.label}>🔑 SECURITY PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            placeholder="Enter 4-digit PIN (e.g. 1234)"
            placeholderTextColor="#71717A"
          />

          {/* Error Message */}
          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#080805" />
            ) : (
              <Text style={styles.submitBtnText}>
                CONNECT {vehicleType === 'bike' ? 'SCOOTER' : 'CAR'} ➔
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerLinkText}>
              Need a custom EV profile? Register vehicle ➔
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          EV Multi-Agent OS Mobile v2.5 · Powered by FastAPI & Groq AI
        </Text>
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
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#DFFF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 0, 0.3)',
    borderRadius: 20,
    padding: 20,
  },
  label: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
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
    padding: 14,
    alignItems: 'center',
  },
  typeCardActive: {
    backgroundColor: 'rgba(223, 255, 0, 0.12)',
    borderColor: '#DFFF00',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeName: {
    color: '#A1A1AA',
    fontSize: 12,
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
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipActive: {
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    borderColor: '#DFFF00',
  },
  presetText: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
  },
  presetTextActive: {
    color: '#DFFF00',
    fontWeight: '900',
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
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    color: '#52525B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  },
});
