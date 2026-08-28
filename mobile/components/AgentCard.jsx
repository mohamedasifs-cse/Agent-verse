import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AgentCard({
  name,
  status = 'ACTIVE',
  recommendation,
  confidence = 95,
  icon = '🤖',
}) {
  const isHealthy = status === 'OPTIMAL' || status === 'ACTIVE' || status === 'NORMAL';
  const isWarning = status === 'ALERT' || status === 'WARNING';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        <View
          style={[
            styles.badge,
            isHealthy
              ? styles.badgeGreen
              : isWarning
              ? styles.badgeYellow
              : styles.badgeRed,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isHealthy
                ? styles.textGreen
                : isWarning
                ? styles.textYellow
                : styles.textRed,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      {recommendation ? (
        <Text style={styles.recommendationText}>{recommendation}</Text>
      ) : (
        <Text style={styles.placeholderText}>Monitoring EV system parameters continuously.</Text>
      )}

      {confidence !== undefined && (
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence Score</Text>
          <Text style={styles.confidenceValue}>{confidence}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  badgeYellow: { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
  badgeRed: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  textGreen: { color: '#22C55E' },
  textYellow: { color: '#EAB308' },
  textRed: { color: '#EF4444' },
  recommendationText: {
    color: '#D4D4D8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#71717A',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    pt: 6,
    paddingTop: 6,
  },
  confidenceLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceValue: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
  },
});
