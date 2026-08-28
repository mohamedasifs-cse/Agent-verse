import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ReportsPanel({ telemetry, vehicleName }) {
  const distanceKm = telemetry?.totalDistanceKm || 42.5;
  const co2SavedKg = Math.round(distanceKm * 0.14);
  const totalCostSavedInr = Math.round(distanceKm * 6.5);

  const recentSessions = [
    { id: 'cs1', station: 'ChargePoint SuperHub', energy: '22.4 kWh', cost: '₹224', date: 'Today, 10:30 AM' },
    { id: 'cs2', station: 'Tesla Supercharger', energy: '35.0 kWh', cost: '₹420', date: 'Yesterday, 06:15 PM' },
    { id: 'cs3', station: 'EVgo Fast Station', energy: '18.2 kWh', cost: '₹182', date: '25 Aug, 02:40 PM' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>📊</Text>
        </View>
        <View>
          <Text style={styles.title}>
            — ANALYTICS & FLEET REPORTS AGENT
          </Text>
          <Text style={styles.subtitle}>
            Historical telemetry trends, degradation & carbon impact
          </Text>
        </View>
      </View>

      {/* Sustainability Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.mIcon}>🌱</Text>
          <Text style={styles.mLabel}>CO₂ SAVED</Text>
          <Text style={styles.mValGreen}>{co2SavedKg} kg</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.mIcon}>💰</Text>
          <Text style={styles.mLabel}>SAVINGS VS PETROL</Text>
          <Text style={styles.mValYellow}>₹{totalCostSavedInr}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.mIcon}>🔋</Text>
          <Text style={styles.mLabel}>PACK HEALTH</Text>
          <Text style={styles.mValCyan}>96% SOH</Text>
        </View>
      </View>

      {/* Session History */}
      <Text style={styles.sectionTitle}>📜 RECENT CHARGING SESSIONS</Text>

      {recentSessions.map((s) => (
        <View key={s.id} style={styles.sessionItem}>
          <View style={styles.sessionLeft}>
            <Text style={styles.sStation}>{s.station}</Text>
            <Text style={styles.sDate}>{s.date}</Text>
          </View>
          <View style={styles.sessionRight}>
            <Text style={styles.sEnergy}>{s.energy}</Text>
            <Text style={styles.sCost}>{s.cost}</Text>
          </View>
        </View>
      ))}
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
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 1,
    borderColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 16 },
  title: { color: '#60a5fa', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#999994', fontSize: 11, marginTop: 1 },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2e2e2b',
    alignItems: 'center',
  },
  mIcon: { fontSize: 16, marginBottom: 2 },
  mLabel: { color: '#555550', fontSize: 8, fontWeight: '800' },
  mValGreen: { color: '#22c55e', fontSize: 13, fontWeight: '900', marginTop: 2 },
  mValYellow: { color: '#d4d414', fontSize: 13, fontWeight: '900', marginTop: 2 },
  mValCyan: { color: '#00f0ff', fontSize: 13, fontWeight: '900', marginTop: 2 },
  sectionTitle: { color: '#d4d414', fontSize: 9, fontWeight: '800', marginBottom: 10 },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  sessionLeft: {},
  sStation: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  sDate: { color: '#555550', fontSize: 10, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sEnergy: { color: '#00f0ff', fontSize: 12, fontWeight: '800' },
  sCost: { color: '#d4d414', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
