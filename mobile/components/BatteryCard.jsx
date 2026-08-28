import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BatteryCard({
  soc = 82,
  soh = 96,
  temperature = 26,
  voltage = 380,
  current = 12,
  estimatedRange = 380,
  vehicleType = 'car',
}) {
  const isHighTemp = temperature > 38;
  const isLowBattery = soc < 20;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>⚡ BATTERY INTELLIGENCE</Text>
        <View
          style={[
            styles.badge,
            isHighTemp
              ? styles.badgeDanger
              : isLowBattery
              ? styles.badgeWarning
              : styles.badgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isHighTemp
                ? styles.textDanger
                : isLowBattery
                ? styles.textWarning
                : styles.textSuccess,
            ]}
          >
            {isHighTemp ? 'HIGH TEMP' : isLowBattery ? 'LOW SOC' : 'HEALTHY'}
          </Text>
        </View>
      </View>

      {/* Main SoC Progress Bar */}
      <View style={styles.socContainer}>
        <View style={styles.socLabelRow}>
          <Text style={styles.socText}>State of Charge (SoC)</Text>
          <Text style={styles.socValue}>{Math.round(soc)}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, soc))}%`,
                backgroundColor: isLowBattery ? '#EF4444' : '#DFFF00',
              },
            ]}
          />
        </View>
      </View>

      {/* Metric Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.metricLabel}>State of Health (SoH)</Text>
          <Text style={styles.metricValue}>{soh}%</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text
            style={[
              styles.metricValue,
              isHighTemp ? { color: '#EF4444' } : null,
            ]}
          >
            {temperature}°C
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.metricLabel}>Est. Range</Text>
          <Text style={styles.metricValueCyan}>{estimatedRange} km</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.metricLabel}>Voltage / Current</Text>
          <Text style={styles.metricValueSub}>{voltage}V / {current}A</Text>
        </View>
      </View>

      {/* Battery Warnings */}
      {isHighTemp && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Battery temperature is high. Consider reducing load or stopping.
          </Text>
        </View>
      )}

      {isLowBattery && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            🪫 Low battery detected. Recommended charging station ahead.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 0, 0.25)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#DFFF00',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textSuccess: { color: '#22C55E' },
  textWarning: { color: '#EAB308' },
  textDanger: { color: '#EF4444' },
  socContainer: {
    marginBottom: 16,
  },
  socLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  socText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  socValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricValueCyan: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricValueSub: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
  },
  warningBox: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: 10,
  },
  warningText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
