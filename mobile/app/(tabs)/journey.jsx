import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useJourneyContext } from '../../context/JourneyContext';
import { useVehicle } from '../../context/VehicleContext';
import { useJourney } from '../../hooks/useJourney';
import SafetyAlert from '../../components/SafetyAlert';
import RecommendationCard from '../../components/RecommendationCard';

export default function JourneyScreen() {
  const router = useRouter();
  const { activeTrip, bookedSlot, journeyStatus, clearTrip } = useJourneyContext();
  const { soc, batteryTemp, estimatedRangeKm, speedKmh } = useVehicle();
  const { location } = useJourney();

  const isNavigating = journeyStatus === 'NAVIGATING';
  const isArrived = journeyStatus === 'STATION_ARRIVED' || bookedSlot?.isArrived;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>STATUS: {journeyStatus}</Text>
          </View>
          <Text style={styles.gpsText}>
            GPS: {location?.coords?.latitude?.toFixed(4)}, {location?.coords?.longitude?.toFixed(4)}
          </Text>
        </View>

        {/* Arrival Alert */}
        {isArrived && (
          <View style={styles.arrivalCard}>
            <Text style={styles.arrivalTitle}>⚡ CHARGING STATION REACHED!</Text>
            <Text style={styles.arrivalDesc}>
              Your reserved slot at {bookedSlot?.stationName || 'the charging hub'} is ready.
            </Text>
            <TouchableOpacity
              style={styles.boostBtn}
              onPress={() => router.push('/charging/boost')}
            >
              <Text style={styles.boostBtnText}>LAUNCH BOOST UP SIMULATION ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Trip Info */}
        {activeTrip ? (
          <View style={styles.tripCard}>
            <Text style={styles.cardHeader}>📍 ACTIVE ROUTE TELEMETRY</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Origin:</Text>
              <Text style={styles.val}>{activeTrip.origin.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.valCyan}>{activeTrip.destination.name}</Text>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.mLabel}>Distance Left</Text>
                <Text style={styles.mValYellow}>{activeTrip.distanceKm} km</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.mLabel}>Est. ETA</Text>
                <Text style={styles.mVal}>{activeTrip.etaMinutes} min</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.mLabel}>Est. Range Left</Text>
                <Text style={styles.mValCyan}>{estimatedRangeKm} km</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.endTripBtn} onPress={clearTrip}>
              <Text style={styles.endTripText}>END JOURNEY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noTripCard}>
            <Text style={styles.noTripIcon}>🗺️</Text>
            <Text style={styles.noTripTitle}>No Active Journey</Text>
            <Text style={styles.noTripSub}>Plan a route to start live multi-agent trip tracking.</Text>
            <TouchableOpacity
              style={styles.planBtn}
              onPress={() => router.push('/(tabs)/route')}
            >
              <Text style={styles.planBtnText}>PLAN NEW ROUTE ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Booked Slot Info if present */}
        {bookedSlot && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingHeader}>🔌 RESERVED CHARGING SLOT</Text>
            <Text style={styles.stationTitle}>{bookedSlot.stationName}</Text>
            <Text style={styles.bookingDetail}>
              Slot Time: {bookedSlot.slotTime} · {bookedSlot.powerKw} kW Fast Charge
            </Text>
          </View>
        )}

        {/* Live Safety Monitoring */}
        {batteryTemp > 38 && (
          <SafetyAlert
            type="danger"
            title="BATTERY TEMPERATURE WARNING"
            message="Battery temperature is high (39°C). Consider stopping at nearby station."
          />
        )}

        <RecommendationCard
          recommendation="Maintain speed at 45 km/h for optimal battery efficiency. ChargePoint SuperHub is 2.8 km ahead on your right."
          sourceAgent="Supervisor Agent"
        />
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
    paddingBottom: 100,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#DFFF00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '900',
  },
  gpsText: {
    color: '#71717A',
    fontSize: 11,
  },
  arrivalCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  arrivalTitle: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  arrivalDesc: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 12,
  },
  boostBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  boostBtnText: {
    color: '#080805',
    fontSize: 12,
    fontWeight: '900',
  },
  tripCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    color: '#DFFF00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: '#71717A', fontSize: 12 },
  val: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  valCyan: { color: '#00F0FF', fontSize: 12, fontWeight: '800' },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    marginVertical: 12,
  },
  metricBox: { alignItems: 'center', flex: 1 },
  mLabel: { color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  mVal: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  mValYellow: { color: '#DFFF00', fontSize: 14, fontWeight: '800', marginTop: 2 },
  mValCyan: { color: '#00F0FF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  endTripBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  endTripText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  noTripCard: {
    backgroundColor: '#111110',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  noTripIcon: { fontSize: 36, marginBottom: 8 },
  noTripTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  noTripSub: { color: '#71717A', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  planBtn: {
    backgroundColor: '#DFFF00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  planBtnText: { color: '#080805', fontSize: 12, fontWeight: '900' },
  bookingCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bookingHeader: { color: '#00F0FF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  stationTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  bookingDetail: { color: '#A1A1AA', fontSize: 12 },
});
