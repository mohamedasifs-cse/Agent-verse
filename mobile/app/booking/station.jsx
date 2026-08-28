import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function StationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let station = {
    id: 'station_a',
    name: 'ChargePoint SuperHub',
    powerKw: 150,
    connectors: ['CCS2', 'Type 2'],
    available: 4,
    total: 6,
    pricePerKwh: '$0.35',
    rating: 4.8,
    distanceKm: 2.8,
  };

  if (params.stationData) {
    try {
      station = JSON.parse(params.stationData);
    } catch (e) {}
  }

  const handleProceedToSlot = () => {
    router.push({
      pathname: '/booking/slot',
      params: { stationData: JSON.stringify(station) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.badge}>🔌 FAST CHARGING STATION</Text>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.distance}>📍 {station.distanceKm} km from current EV position</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CHARGER SPECIFICATIONS</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Max Charging Power</Text>
            <Text style={styles.valCyan}>{station.powerKw} kW</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Connector Types</Text>
            <Text style={styles.val}>
              {Array.isArray(station.connectors)
                ? station.connectors.join(', ')
                : station.connectors}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Available Chargers</Text>
            <Text style={styles.valGreen}>
              {station.available} of {station.total} Available
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tariff Rate</Text>
            <Text style={styles.valYellow}>{station.pricePerKwh || '$0.35/kWh'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>User Rating</Text>
            <Text style={styles.val}>★ {station.rating || 4.8} / 5.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.proceedBtn} onPress={handleProceedToSlot}>
          <Text style={styles.proceedBtnText}>VIEW AVAILABLE SLOTS ➔</Text>
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
  },
  headerBox: {
    marginBottom: 20,
  },
  badge: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  stationName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  distance: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    pb: 8,
    paddingBottom: 8,
  },
  label: { color: '#71717A', fontSize: 12 },
  val: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  valCyan: { color: '#00F0FF', fontSize: 13, fontWeight: '800' },
  valGreen: { color: '#22C55E', fontSize: 12, fontWeight: '800' },
  valYellow: { color: '#DFFF00', fontSize: 12, fontWeight: '800' },
  proceedBtn: {
    backgroundColor: '#DFFF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
  },
});
