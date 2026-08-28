import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HeaderBar({
  vehicleConfig,
  connected = true,
  onOpenAgents,
  onLogout,
}) {
  const isBike = vehicleConfig?.type === 'bike';
  const vehicleName = vehicleConfig?.name || 'Porsche Taycan EV';

  return (
    <View style={styles.header}>
      {/* Left side: Hamburger 3-lines button + Logo */}
      <View style={styles.leftBox}>
        <TouchableOpacity style={styles.agentsBtn} onPress={onOpenAgents}>
          <Text style={styles.hamburgerIcon}>☰</Text>
          <Text style={styles.agentsBtnText}>AI AGENTS (12)</Text>
        </TouchableOpacity>

        <View style={styles.logoGroup}>
          <View style={styles.logoIconBox}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>EV Multi-Agent OS</Text>
            <Text style={styles.brandSub}>INTELLIGENT PLATFORM</Text>
          </View>
        </View>
      </View>

      {/* Right side: Vehicle badge, connection & logout */}
      <View style={styles.rightBox}>
        <View style={styles.vehicleBadge}>
          <Text style={styles.vehicleBadgeText}>
            {isBike ? '🏍️' : '🚗'} {vehicleName}
          </Text>
        </View>

        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, connected ? styles.dotConnected : styles.dotOffline]} />
          <Text style={styles.statusText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(8, 8, 5, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#2e2e2b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  hamburgerIcon: {
    color: '#00f0ff',
    fontSize: 14,
    fontWeight: '900',
  },
  agentsBtnText: {
    color: '#00f0ff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBox: {
    width: 28,
    height: 28,
    backgroundColor: '#d4d414',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    color: '#080805',
    fontSize: 14,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSub: {
    color: '#555550',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleBadge: {
    backgroundColor: 'rgba(212, 212, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 212, 20, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleBadgeText: {
    color: '#d4d414',
    fontSize: 10,
    fontWeight: '800',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotConnected: {
    backgroundColor: '#22c55e',
  },
  dotOffline: {
    backgroundColor: '#ff5050',
  },
  statusText: {
    color: '#999994',
    fontSize: 10,
  },
  logoutBtn: {
    padding: 4,
  },
  logoutText: {
    fontSize: 14,
  },
});
