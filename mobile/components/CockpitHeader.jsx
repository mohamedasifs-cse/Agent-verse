import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CockpitHeader({ soc = 80, range = 400, stationCount = 8 }) {
  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⚡</Text>
        </View>
        <View>
          <Text style={styles.title}>Smart EV Cockpit & Telemetry</Text>
          <Text style={styles.subtitle}>Real-Time AI Multi-Agent Intelligence Platform</Text>
        </View>
      </View>

      {/* Metric Badges */}
      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>⚡</Text>
          <View>
            <Text style={styles.badgeLabel}>BATTERY SOC</Text>
            <Text style={styles.badgeValCyan}>{Math.round(soc)}%</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🛣️</Text>
          <View>
            <Text style={styles.badgeLabel}>EST. RANGE</Text>
            <Text style={styles.badgeValWhite}>{Math.round(range)} km</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🔌</Text>
          <View>
            <Text style={styles.badgeLabel}>STATIONS</Text>
            <Text style={styles.badgeValYellow}>{stationCount} Hubs</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#2e2e2b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: '#00f0ff',
    fontSize: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#999994',
    fontSize: 10,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2e2e2b',
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeLabel: {
    color: '#555550',
    fontSize: 8,
    fontWeight: '800',
  },
  badgeValCyan: {
    color: '#00f0ff',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeValWhite: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeValYellow: {
    color: '#d4d414',
    fontSize: 12,
    fontWeight: '900',
  },
});
