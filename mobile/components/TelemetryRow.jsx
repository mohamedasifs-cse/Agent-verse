import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TelemetryRow({ telemetry, vehicleConfig }) {
  const soc = telemetry?.soc !== undefined ? Math.round(telemetry.soc) : 80;
  const range = telemetry?.estimatedRangeKm !== undefined ? Math.round(telemetry.estimatedRangeKm) : 400;
  const capacity = vehicleConfig?.batteryCapacity || 75.0;
  const topSpeed = vehicleConfig?.topSpeed || 180;
  const chargeTime = vehicleConfig?.chargingTime || '45 min';
  const temp = telemetry?.temperatureC || 25;

  return (
    <View style={styles.grid}>
      {/* State of Charge */}
      <View style={styles.card}>
        <Text style={styles.label}>⚡ State of Charge</Text>
        <Text style={[styles.val, soc <= 15 ? styles.valRed : styles.valYellow]}>
          {soc}%
        </Text>
      </View>

      {/* Est Range */}
      <View style={styles.card}>
        <Text style={styles.label}>🛣️ Est. Range</Text>
        <Text style={styles.valWhite}>{range} km</Text>
      </View>

      {/* Battery Capacity */}
      <View style={styles.card}>
        <Text style={styles.label}>🔋 Battery Capacity</Text>
        <Text style={styles.valYellow}>{capacity} kWh</Text>
      </View>

      {/* Top Speed */}
      <View style={styles.card}>
        <Text style={styles.label}>🏎️ Top Speed</Text>
        <Text style={styles.valCyan}>{topSpeed} km/h</Text>
      </View>

      {/* Charge Time */}
      <View style={styles.card}>
        <Text style={styles.label}>⏱️ Est. Charge Time</Text>
        <Text style={styles.valYellow}>{chargeTime}</Text>
      </View>

      {/* Temperature */}
      <View style={styles.card}>
        <Text style={styles.label}>🌡️ Temperature</Text>
        <Text style={[styles.val, temp > 40 ? styles.valRed : styles.valOrange]}>
          {temp}°C
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 14,
    padding: 12,
  },
  label: {
    color: '#555550',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  val: {
    fontSize: 18,
    fontWeight: '800',
  },
  valYellow: { color: '#d4d414', fontSize: 18, fontWeight: '800' },
  valWhite: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  valCyan: { color: '#00f0ff', fontSize: 18, fontWeight: '800' },
  valRed: { color: '#ff5050', fontSize: 18, fontWeight: '800' },
  valOrange: { color: '#f59e0b', fontSize: 18, fontWeight: '800' },
});
