import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';

const HELPER_EV_PRESETS = [
  { id: 'h1', owner: 'Tesla Model 3 (Priya S.)', soc: 88, distanceKm: 1.2, powerKw: 25, pricePerKwh: '₹12/kWh' },
  { id: 'h2', owner: 'Tata Nexon EV (Rahul M.)', soc: 76, distanceKm: 2.5, powerKw: 20, pricePerKwh: '₹10/kWh' },
  { id: 'h3', owner: 'MG ZS EV (Amit K.)', soc: 91, distanceKm: 3.1, powerKw: 30, pricePerKwh: '₹15/kWh' },
];

export default function V2VTransferPanel({ soc = 80 }) {
  const [requestedKwh, setRequestedKwh] = useState('10');
  const [selectedHelper, setSelectedHelper] = useState(HELPER_EV_PRESETS[0]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDone, setTransferDone] = useState(false);

  const handleRequestTransfer = () => {
    setIsTransferring(true);
    setTransferDone(false);
    setTimeout(() => {
      setIsTransferring(false);
      setTransferDone(true);
    }, 2500);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⚡🔋</Text>
        </View>
        <View>
          <Text style={styles.title}>
            — V2V ENERGY SHARE INTELLIGENCE AGENT
          </Text>
          <Text style={styles.subtitle}>
            Peer-to-Peer Vehicle-to-Vehicle Emergency Charging
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>NEARBY HELPER VEHICLES AVAILABLE</Text>

      {HELPER_EV_PRESETS.map((helper) => {
        const isSelected = selectedHelper?.id === helper.id;
        return (
          <TouchableOpacity
            key={helper.id}
            style={[styles.helperCard, isSelected ? styles.helperSelected : null]}
            onPress={() => setSelectedHelper(helper)}
          >
            <View style={styles.helperHeader}>
              <Text style={styles.helperName}>{helper.owner}</Text>
              <Text style={styles.helperSoc}>{helper.soc}% SoC</Text>
            </View>
            <View style={styles.helperMetaRow}>
              <Text style={styles.metaChip}>📍 {helper.distanceKm} km away</Text>
              <Text style={styles.metaChipCyan}>⚡ {helper.powerKw} kW V2V</Text>
              <Text style={styles.metaChipYellow}>{helper.pricePerKwh}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ENERGY REQUEST AMOUNT (kWh)</Text>
        <TextInput
          style={styles.input}
          value={requestedKwh}
          onChangeText={setRequestedKwh}
          keyboardType="numeric"
        />
      </View>

      {!isTransferring && !transferDone && (
        <TouchableOpacity style={styles.transferBtn} onPress={handleRequestTransfer}>
          <Text style={styles.transferBtnText}>REQUEST EMERGENCY V2V SHARE ➔</Text>
        </TouchableOpacity>
      )}

      {isTransferring && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#00f0ff" />
          <Text style={styles.loadingText}>Establishing V2V Power Cable Handshake...</Text>
        </View>
      )}

      {transferDone && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✓ V2V TRANSFER SUCCESSFUL! Received {requestedKwh} kWh from {selectedHelper.owner}.
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
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 14 },
  title: { color: '#00f0ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#999994', fontSize: 11, marginTop: 1 },
  sectionLabel: { color: '#d4d414', fontSize: 9, fontWeight: '800', marginBottom: 10 },
  helperCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  helperSelected: {
    borderColor: '#00f0ff',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  helperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  helperName: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  helperSoc: { color: '#22c55e', fontSize: 12, fontWeight: '800' },
  helperMetaRow: { flexDirection: 'row', gap: 8 },
  metaChip: { color: '#999994', fontSize: 10 },
  metaChipCyan: { color: '#00f0ff', fontSize: 10, fontWeight: '700' },
  metaChipYellow: { color: '#d4d414', fontSize: 10, fontWeight: '700' },
  inputGroup: { marginTop: 10, marginBottom: 14 },
  inputLabel: { color: '#555550', fontSize: 9, fontWeight: '800', marginBottom: 4 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#444440',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  transferBtn: {
    backgroundColor: '#00f0ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  transferBtnText: { color: '#080805', fontSize: 12, fontWeight: '900' },
  loadingBox: { padding: 12, alignItems: 'center' },
  loadingText: { color: '#00f0ff', fontSize: 11, marginTop: 6 },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 10,
  },
  successText: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
});
