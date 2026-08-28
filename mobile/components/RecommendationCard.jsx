import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecommendationCard({
  recommendation = 'Charge at Station B because it has lower waiting time, sufficient charging power and minimal route detour.',
  sourceAgent = 'Supervisor Agent',
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🧠 AI RECOMMENDATION</Text>
        </View>
        <Text style={styles.sourceText}>{sourceAgent}</Text>
      </View>

      <Text style={styles.recommendation}>{recommendation}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>⚡ Multi-Agent Swarm Intelligence Unified Decision</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(223, 255, 0, 0.05)',
    borderWidth: 1.5,
    borderColor: '#DFFF00',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#DFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#DFFF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#080805',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sourceText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  recommendation: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(223, 255, 0, 0.15)',
    paddingTop: 8,
  },
  footerText: {
    color: '#A1A1AA',
    fontSize: 10,
    fontStyle: 'italic',
  },
});
