import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LiveRideControls({
  isDriving = false,
  vehicleType = 'car',
  simMultiplier = 1,
  onToggleDrive,
  onReset,
  onChangeMultiplier,
  isAntiGravity = false,
  onToggleAntiGravity,
}) {
  const isBike = vehicleType === 'bike';

  return (
    <View style={[styles.card, isDriving ? styles.cardActive : null]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          — {isBike ? 'LIVE RIDE CONTROLS' : 'LIVE DRIVE CONTROLS'}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Main Drive / Park Button */}
        <TouchableOpacity
          style={[styles.driveBtn, isDriving ? styles.btnPark : styles.btnDrive]}
          onPress={onToggleDrive}
        >
          <Text style={styles.driveBtnText}>
            {isDriving
              ? (isBike ? '⏸️ PARK SCOOTER' : '⏸️ PARK VEHICLE')
              : (isBike ? '🏍 START YOUR RIDE' : '🚗 START YOUR DRIVE')}
          </Text>
        </TouchableOpacity>

        {/* Anti-Gravity levitation button */}
        <TouchableOpacity
          style={[styles.antiGravBtn, isAntiGravity ? styles.antiGravActive : null]}
          onPress={onToggleAntiGravity}
        >
          <Text style={styles.antiGravText}>
            {isAntiGravity ? '🚀 LEVITATION ACTIVE' : '⚡ ANTI-GRAVITY'}
          </Text>
        </TouchableOpacity>

        {/* Reset button */}
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Speed Multipliers */}
      <View style={styles.multiplierRow}>
        <Text style={styles.multLabel}>SIM SPEED:</Text>
        {[1, 3, 10].map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.multChip,
              simMultiplier === m ? styles.multChipActive : null,
            ]}
            onPress={() => onChangeMultiplier(m)}
          >
            <Text
              style={[
                styles.multChipText,
                simMultiplier === m ? styles.multTextActive : null,
              ]}
            >
              {m}x
            </Text>
          </TouchableOpacity>
        ))}
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
  cardActive: {
    borderColor: '#00f0ff',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#d4d414',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  driveBtn: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDrive: {
    backgroundColor: '#00f0ff',
  },
  btnPark: {
    backgroundColor: '#ff5050',
  },
  driveBtnText: {
    color: '#080805',
    fontSize: 11,
    fontWeight: '900',
  },
  antiGravBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#00f0ff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  antiGravActive: {
    backgroundColor: 'rgba(212, 212, 20, 0.25)',
    borderColor: '#d4d414',
  },
  antiGravText: {
    color: '#00f0ff',
    fontSize: 10,
    fontWeight: '900',
  },
  resetBtn: {
    backgroundColor: '#1e1e1b',
    borderWidth: 1,
    borderColor: '#444440',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetText: {
    color: '#999994',
    fontSize: 11,
    fontWeight: '700',
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multLabel: {
    color: '#555550',
    fontSize: 10,
    fontWeight: '700',
  },
  multChip: {
    backgroundColor: '#1e1e1b',
    borderWidth: 1,
    borderColor: '#444440',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multChipActive: {
    backgroundColor: 'rgba(212, 212, 20, 0.15)',
    borderColor: '#d4d414',
  },
  multChipText: {
    color: '#999994',
    fontSize: 10,
    fontWeight: '700',
  },
  multTextActive: {
    color: '#d4d414',
    fontWeight: '900',
  },
});
