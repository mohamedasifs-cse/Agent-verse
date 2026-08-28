import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DriverSafetyPanel({
  telemetry,
  isDriving = false,
  driverAgentData,
  vehicleType = 'car',
}) {
  const isBike = vehicleType === 'bike';
  const speed = telemetry?.speedKmh || 0;
  const temp = telemetry?.temperatureC || 25;
  const soc = telemetry?.soc || 80;

  const ecoScore = Math.max(65, Math.min(98, 92 - Math.floor(speed / 10)));
  const isSpeeding = speed > (isBike ? 90 : 130);
  const isHighTemp = temp > 40;
  const isLowSoc = soc < 15;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🏎️</Text>
        </View>
        <View>
          <Text style={styles.title}>
            — DRIVER BEHAVIOR & SAFETY AI AGENT
          </Text>
          <Text style={styles.subtitle}>
            Real-time telemetry analysis & safety score
          </Text>
        </View>
      </View>

      {/* Eco Score Gauge */}
      <View style={styles.scoreBox}>
        <View style={styles.scoreLeft}>
          <Text style={styles.scoreLabel}>SAFETY & ECO SCORE</Text>
          <Text style={styles.scoreVal}>{ecoScore} / 100</Text>
        </View>
        <View style={styles.scoreRight}>
          <Text style={styles.statusBadgeText}>
            {ecoScore >= 85 ? '🌟 OPTIMAL' : '⚠️ CAUTION'}
          </Text>
        </View>
      </View>

      {/* Warnings & Coaching */}
      {isSpeeding && (
        <View style={styles.alertBoxDanger}>
          <Text style={styles.alertTextDanger}>
            🚨 HIGH SPEED DETECTED: {Math.round(speed)} km/h. Reduce velocity for safety and battery range retention.
          </Text>
        </View>
      )}

      {isHighTemp && (
        <View style={styles.alertBoxWarning}>
          <Text style={styles.alertTextWarning}>
            ⚠️ BATTERY TEMPERATURE HIGH: {temp}°C. Long continuous load detected. Consider resting.
          </Text>
        </View>
      )}

      {isLowSoc && (
        <View style={styles.alertBoxWarning}>
          <Text style={styles.alertTextWarning}>
            🪫 CRITICAL LOW BATTERY ({soc}%). Driver Agent recommends navigating to nearest fast charging hub.
          </Text>
        </View>
      )}

      {/* Agent Coaching Line */}
      <View style={styles.coachingBox}>
        <Text style={styles.coachingText}>
          💡 AI Tip: {driverAgentData?.recommendation || (isBike ? 'Smooth throttle control on scooters preserves up to 15% range per charge cycle.' : 'Regenerative braking is active. Gentle braking recharges your 800V pack.')}
        </Text>
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#999994',
    fontSize: 11,
    marginTop: 1,
  },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2e2e2b',
  },
  scoreLeft: {},
  scoreLabel: {
    color: '#555550',
    fontSize: 9,
    fontWeight: '800',
  },
  scoreVal: {
    color: '#00f0ff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  scoreRight: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '900',
  },
  alertBoxDanger: {
    backgroundColor: 'rgba(255, 80, 80, 0.12)',
    borderWidth: 1,
    borderColor: '#ff5050',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  alertTextDanger: {
    color: '#ff5050',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  alertBoxWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  alertTextWarning: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  coachingBox: {
    backgroundColor: 'rgba(212, 212, 20, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4d414',
    padding: 10,
    borderRadius: 6,
  },
  coachingText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 16,
  },
});
