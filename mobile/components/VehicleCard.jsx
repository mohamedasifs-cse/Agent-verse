import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function VehicleCard({
  config,
  onPressChange,
  showChangeButton = true,
}) {
  const isBike = config.type === 'bike';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.vehicleInfo}>
          <View style={styles.tagRow}>
            <Text style={styles.typeTag}>
              {isBike ? '🏍️ ELECTRIC BIKE / SCOOTER' : '🚗 ELECTRIC CAR'}
            </Text>
          </View>
          <Text style={styles.vehicleName}>{config.name}</Text>
        </View>

        {showChangeButton && (
          <TouchableOpacity style={styles.changeBtn} onPress={onPressChange}>
            <Text style={styles.changeBtnText}>SWITCH EV ➔</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle Visual Avatar */}
      <View style={styles.visualContainer}>
        <View style={[styles.avatarGlow, { backgroundColor: config.color || '#DFFF00' }]}>
          <Text style={styles.vehicleIcon}>{config.icon || (isBike ? '🛵' : '🏎️')}</Text>
        </View>
      </View>

      {/* Specs bar */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Capacity</Text>
          <Text style={styles.specValue}>{config.batteryCapacity} kWh</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Max Range</Text>
          <Text style={styles.specValueCyan}>{config.maxRange} km</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Top Speed</Text>
          <Text style={styles.specValue}>{config.topSpeed} km/h</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Charge Time</Text>
          <Text style={styles.specValueYellow}>{config.chargingTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleInfo: {
    flex: 1,
  },
  tagRow: {
    marginBottom: 4,
  },
  typeTag: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  changeBtn: {
    backgroundColor: 'rgba(223, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#DFFF00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  avatarGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  vehicleIcon: {
    fontSize: 40,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  specLabel: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  specValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  specValueCyan: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
  },
  specValueYellow: {
    color: '#DFFF00',
    fontSize: 13,
    fontWeight: '800',
  },
});
