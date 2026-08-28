import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VehicleHealthPanel({ telemetry, vehicleName }) {
  const distanceKm = telemetry?.totalDistanceKm || 42.5;
  const tireWearPct = Math.min(100, Math.max(5, Math.floor(distanceKm / 120)));
  const brakePadPct = Math.min(100, Math.max(10, 95 - Math.floor(distanceKm / 200)));
  const inverterTempC = Math.round((telemetry?.temperatureC || 25) + 6);
  const motorVib = '0.04 g';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔧</Text>
        </View>
        <View>
          <Text style={styles.title}>
            — PREDICTIVE MAINTENANCE & VEHICLE HEALTH
          </Text>
          <Text style={styles.subtitle}>
            Hardware thermals, component wear & service interval
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Tire Tread Wear</Text>
          <Text style={styles.itemVal}>{tireWearPct}% Used</Text>
          <Text style={styles.itemSub}>Good Condition</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Brake Pad Health</Text>
          <Text style={styles.itemValGreen}>{brakePadPct}% Remaining</Text>
          <Text style={styles.itemSub}>Optimal Regen</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Inverter Thermals</Text>
          <Text style={styles.itemValCyan}>{inverterTempC}°C</Text>
          <Text style={styles.itemSub}>Cooling Active</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.itemLabel}>Motor Vibration</Text>
          <Text style={styles.itemVal}>{motorVib}</Text>
          <Text style={styles.itemSub}>Smooth Stator</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Next Scheduled Inspection:</Text>
        <Text style={styles.footerVal}>5,000 km or 6 Months</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 16 },
  title: { color: '#f97316', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#999994', fontSize: 11, marginTop: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2e2e2b',
  },
  itemLabel: { color: '#555550', fontSize: 9, fontWeight: '800' },
  itemVal: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginTop: 2 },
  itemValGreen: { color: '#22c55e', fontSize: 14, fontWeight: '800', marginTop: 2 },
  itemValCyan: { color: '#00f0ff', fontSize: 14, fontWeight: '800', marginTop: 2 },
  itemSub: { color: '#999994', fontSize: 9, marginTop: 2 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2e2e2b',
    paddingTop: 8,
  },
  footerLabel: { color: '#999994', fontSize: 11 },
  footerVal: { color: '#d4d414', fontSize: 11, fontWeight: '800' },
});
