import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

export default function EmergencyModal({ visible, onClose, soc = 8 }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <Text style={styles.icon}>🚨</Text>
            <Text style={styles.title}>EMERGENCY ASSISTANCE ACTIVATED</Text>
          </View>

          <Text style={styles.message}>
            CRITICAL LOW BATTERY ({soc}% SoC). The Emergency AI Agent has detected an urgent power depletion event.
          </Text>

          <View style={styles.actionsBox}>
            <TouchableOpacity style={styles.sosBtn} onPress={onClose}>
              <Text style={styles.sosText}>DISPATCH ROADSIDE SOS ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissText}>DISMISS ALERT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#111110',
    borderWidth: 2,
    borderColor: '#ff5050',
    borderRadius: 18,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  icon: { fontSize: 24 },
  title: { color: '#ff5050', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  message: { color: '#ffffff', fontSize: 12, lineHeight: 18, marginBottom: 20 },
  actionsBox: { gap: 10 },
  sosBtn: {
    backgroundColor: '#ff5050',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  sosText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  dismissBtn: {
    backgroundColor: '#1e1e1b',
    borderWidth: 1,
    borderColor: '#444440',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissText: { color: '#999994', fontSize: 11, fontWeight: '700' },
});
