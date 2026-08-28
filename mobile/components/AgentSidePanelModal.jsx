import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const ALL_AGENTS = [
  { key: 'battery', title: 'Battery Intelligence', category: 'Powertrain', icon: '🔋', color: '#22c55e', desc: 'Monitors 800V pack SoC, SoH, cell balance & thermal dissipation.' },
  { key: 'route', title: 'Route Intelligence', category: 'Navigation', icon: '🗺️', color: '#00f0ff', desc: 'Calculates optimal OSRM polyline highway routes & range arcs.' },
  { key: 'charging', title: 'Charging Intelligence', category: 'Powertrain', icon: '⚡', color: '#d4d414', desc: 'Locates ultra-fast DC fast hubs, power kW, tariffs & availability.' },
  { key: 'emergency', title: 'Emergency Assistance', category: 'Safety', icon: '🚨', color: '#ff5050', desc: 'Detects critical battery (≤10%), thermal anomalies & airbag deployment.' },
  { key: 'v2v', title: 'Vehicle-to-Vehicle (V2V)', category: 'Powertrain', icon: '⚡🔋', color: '#00f0ff', desc: 'P2P battery energy transfer sharing between nearby opted-in EVs.' },
  { key: 'energy', title: 'Energy & Sustainability', category: 'Powertrain', icon: '🌱', color: '#22c55e', desc: 'Tracks carbon savings (kg CO₂) & regenerative braking energy recovery.' },
  { key: 'pricing', title: 'Pricing & Cost', category: 'Economics', icon: '💰', color: '#f59e0b', desc: 'Compares charging tariffs (₹/kWh) and off-peak utility grid rates.' },
  { key: 'analytics', title: 'Analytics & Reports', category: 'Diagnostics', icon: '📊', color: '#60a5fa', desc: 'Aggregates telemetry trends, charging logs & degradation reports.' },
  { key: 'weather', title: 'Weather & Climate', category: 'Environment', icon: '🌤️', color: '#38bdf8', desc: 'Analyzes ambient thermals, headwind speeds & HVAC power draw.' },
  { key: 'driver', title: 'Driver Behavior & Safety', category: 'Safety', icon: '🏎️', color: '#a855f7', desc: 'Evaluates throttle smoothness, braking habits & safety score (0-100).' },
  { key: 'grid', title: 'Grid Load & V2G', category: 'Powertrain', icon: '🔌', color: '#ec4899', desc: 'Manages Vehicle-to-Grid (V2G) energy export back during peak tariff hours.' },
  { key: 'antigravity', title: 'Anti-Gravity Agent', category: 'Powertrain', icon: '🚀', color: '#00f0ff', desc: 'Experimental magnetic levitation simulation & anti-gravity thrust.' },
  { key: 'maintenance', title: 'Predictive Maintenance', category: 'Hardware', icon: '🔧', color: '#f97316', desc: 'Inspects tire tread wear %, brake pads, inverter thermals & motor vibration.' },
];

export default function AgentSidePanelModal({ visible, onClose, agentResults }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredAgents = ALL_AGENTS.filter((agent) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Powertrain') return ['battery', 'charging', 'v2v', 'energy', 'grid', 'antigravity'].includes(agent.key);
    if (activeFilter === 'Safety') return ['emergency', 'driver'].includes(agent.key);
    if (activeFilter === 'Hardware') return ['maintenance', 'weather'].includes(agent.key);
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>☰</Text>
            </View>
            <View>
              <Text style={styles.title}>AI Agents Control Panel</Text>
              <Text style={styles.subtitle}>12 SPECIALIZED VEHICLE AI DOMAINS</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕ CLOSE</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {['All', 'Powertrain', 'Safety', 'Hardware'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f ? styles.chipActive : null]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, activeFilter === f ? styles.chipTextActive : null]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Agent Cards List */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredAgents.map((agent) => {
            const resultData = agentResults ? agentResults[agent.key] : null;
            const status = resultData?.status || 'ACTIVE';
            const rec = resultData?.recommendation || resultData?.summary || agent.desc;

            return (
              <View key={agent.key} style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentLeft}>
                    <Text style={styles.agentIcon}>{agent.icon}</Text>
                    <View>
                      <Text style={[styles.agentTitle, { color: agent.color }]}>
                        {agent.title}
                      </Text>
                      <Text style={styles.agentCategory}>{agent.category}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: agent.color }]}>
                    <Text style={[styles.statusText, { color: agent.color }]}>{status}</Text>
                  </View>
                </View>

                <Text style={styles.agentDesc}>{rec}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2e2e2b',
    backgroundColor: '#111110',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { color: '#00f0ff', fontSize: 16, fontWeight: '900' },
  title: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  subtitle: { color: '#00f0ff', fontSize: 9, fontWeight: '800' },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#444440',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2e2e2b',
  },
  filterChip: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00f0ff',
  },
  chipText: { color: '#999994', fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: '#00f0ff', fontWeight: '900' },
  scrollContent: {
    padding: 16,
  },
  agentCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentIcon: { fontSize: 20 },
  agentTitle: { fontSize: 13, fontWeight: '800' },
  agentCategory: { color: '#555550', fontSize: 9, fontWeight: '700' },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: { fontSize: 9, fontWeight: '900' },
  agentDesc: { color: '#999994', fontSize: 11, lineHeight: 16 },
});
