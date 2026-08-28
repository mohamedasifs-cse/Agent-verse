import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let booking = {
    id: 'booking_demo_101',
    stationName: 'ChargePoint SuperHub',
    slotTime: '10:30 AM - 11:00 AM',
    bookingDate: new Date().toISOString().split('T')[0],
    powerKw: 150,
  };

  if (params.bookingData) {
    try {
      booking = JSON.parse(params.bookingData);
    } catch (e) {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.title}>CHARGING SLOT CONFIRMED!</Text>
        <Text style={styles.subtitle}>
          Your EV charging slot reservation has been registered with the Supervisor Agent.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>RESERVATION SUMMARY</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.valCyan}>{booking.id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Station</Text>
            <Text style={styles.val}>{booking.stationName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.val}>{booking.bookingDate}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time Slot</Text>
            <Text style={styles.valYellow}>{booking.slotTime}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Charging Speed</Text>
            <Text style={styles.val}>{booking.powerKw} kW Fast DC</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Reservation Status</Text>
            <Text style={styles.valGreen}>RESERVED & READY</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.journeyBtn}
          onPress={() => router.push('/(tabs)/journey')}
        >
          <Text style={styles.journeyBtnText}>OPEN LIVE JOURNEY & GPS ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boostBtn}
          onPress={() => router.push('/charging/boost')}
        >
          <Text style={styles.boostBtnText}>SIMULATE CHARGING (BOOST UP) ➔</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#22C55E',
    fontWeight: '900',
  },
  title: {
    color: '#22C55E',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    color: '#DFFF00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    pb: 8,
    paddingBottom: 8,
  },
  label: { color: '#71717A', fontSize: 12 },
  val: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  valCyan: { color: '#00F0FF', fontSize: 12, fontWeight: '800' },
  valGreen: { color: '#22C55E', fontSize: 12, fontWeight: '800' },
  valYellow: { color: '#DFFF00', fontSize: 12, fontWeight: '800' },
  journeyBtn: {
    width: '100%',
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  journeyBtnText: {
    color: '#080805',
    fontSize: 12,
    fontWeight: '900',
  },
  boostBtn: {
    width: '100%',
    backgroundColor: '#DFFF00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  boostBtnText: {
    color: '#080805',
    fontSize: 12,
    fontWeight: '900',
  },
});
