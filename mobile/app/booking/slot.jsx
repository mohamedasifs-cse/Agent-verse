import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useJourneyContext } from '../../context/JourneyContext';

const AVAILABLE_SLOTS = [
  { id: 's1', time: '10:00 AM - 10:30 AM', available: true },
  { id: 's2', time: '10:30 AM - 11:00 AM', available: true },
  { id: 's3', time: '11:00 AM - 11:30 AM', available: false },
  { id: 's4', time: '11:30 AM - 12:00 PM', available: true },
  { id: 's5', time: '02:00 PM - 02:30 PM', available: true },
  { id: 's6', time: '03:00 PM - 03:30 PM', available: true },
];

export default function SelectSlotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { bookChargingSlot } = useJourneyContext();

  const [selectedSlotId, setSelectedSlotId] = useState('s2');

  let station = {
    id: 'station_a',
    name: 'ChargePoint SuperHub',
    powerKw: 150,
  };

  if (params.stationData) {
    try {
      station = JSON.parse(params.stationData);
    } catch (e) {}
  }

  const handleConfirmSlot = () => {
    const slotObj = AVAILABLE_SLOTS.find(s => s.id === selectedSlotId);
    if (!slotObj || !slotObj.available) return;

    const booking = bookChargingSlot(station, slotObj.time);

    router.push({
      pathname: '/booking/confirmation',
      params: { bookingData: JSON.stringify(booking) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>SELECT CHARGING TIME SLOT</Text>
        <Text style={styles.subtitle}>Station: {station.name}</Text>

        <View style={styles.slotGrid}>
          {AVAILABLE_SLOTS.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                disabled={!slot.available}
                style={[
                  styles.slotCard,
                  isSelected ? styles.slotSelected : null,
                  !slot.available ? styles.slotDisabled : null,
                ]}
                onPress={() => setSelectedSlotId(slot.id)}
              >
                <Text
                  style={[
                    styles.slotTime,
                    isSelected ? styles.timeSelected : null,
                    !slot.available ? styles.timeDisabled : null,
                  ]}
                >
                  {slot.time}
                </Text>
                <Text
                  style={[
                    styles.slotStatus,
                    slot.available ? styles.statusAvail : styles.statusFull,
                  ]}
                >
                  {slot.available ? 'AVAILABLE' : 'BOOKED'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmSlot}>
          <Text style={styles.confirmBtnText}>CONFIRM SLOT BOOKING ➔</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    color: '#DFFF00',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 20,
  },
  slotGrid: {
    gap: 12,
    marginBottom: 24,
  },
  slotCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotSelected: {
    borderColor: '#DFFF00',
    borderWidth: 2,
    backgroundColor: 'rgba(223, 255, 0, 0.08)',
  },
  slotDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  slotTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeSelected: {
    color: '#DFFF00',
    fontWeight: '900',
  },
  timeDisabled: {
    color: '#52525B',
  },
  slotStatus: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusAvail: {
    color: '#22C55E',
  },
  statusFull: {
    color: '#EF4444',
  },
  confirmBtn: {
    backgroundColor: '#DFFF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
  },
});
