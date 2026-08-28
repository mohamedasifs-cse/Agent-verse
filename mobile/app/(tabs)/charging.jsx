import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useVehicle } from '../../context/VehicleContext';
import { chargingService } from '../../services/chargingService';
import { agentService } from '../../services/agentService';
import StationCard from '../../components/StationCard';
import RecommendationCard from '../../components/RecommendationCard';
import LoadingState from '../../components/LoadingState';

export default function ChargingScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { vehicleName, vehicleType, soc, soh } = useVehicle();

  const currentLat = location?.coords?.latitude || 37.7749;
  const currentLon = location?.coords?.longitude || -122.4194;

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supervisorRec, setSupervisorRec] = useState('');

  useEffect(() => {
    loadChargingData();
  }, [currentLat, currentLon]);

  const loadChargingData = async () => {
    try {
      const fetchedStations = await chargingService.getNearbyStations(
        currentLat,
        currentLon
      );
      setStations(fetchedStations);

      // Trigger Charging Agent / Supervisor AI analysis
      const analysis = await agentService.analyzeSystem({
        telemetry: { soc, soh, vehicleType, vehicleModel: vehicleName },
        origin: { lat: currentLat, lon: currentLon },
      });

      if (analysis?.agents?.charging?.recommendation) {
        setSupervisorRec(analysis.agents.charging.recommendation);
      } else if (analysis?.summary) {
        setSupervisorRec(analysis.summary);
      }
    } catch (err) {
      console.warn('[ChargingScreen] Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChargingData();
    setRefreshing(false);
  };

  const handleBookPress = (station) => {
    router.push({
      pathname: '/booking/station',
      params: { stationData: JSON.stringify(station) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#DFFF00"
          />
        }
      >
        {/* Supervisor AI Recommendation Card */}
        {!!supervisorRec && (
          <RecommendationCard
            recommendation={supervisorRec}
            sourceAgent="Charging & Supervisor AI Agent"
          />
        )}

        <Text style={styles.sectionTitle}>⚡ NEARBY CHARGING STATIONS</Text>

        {loading ? (
          <LoadingState message="Fetching real-time charging station telemetry..." />
        ) : (
          stations.map((st, idx) => (
            <StationCard
              key={st.id || idx}
              station={st}
              isRecommended={st.isRecommended || idx === 0}
              onBookPress={handleBookPress}
            />
          ))
        )}
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
  sectionTitle: {
    color: '#DFFF00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
    marginTop: 4,
  },
});
