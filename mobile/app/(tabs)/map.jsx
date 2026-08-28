import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useVehicle } from '../../context/VehicleContext';
import { useJourneyContext } from '../../context/JourneyContext';
import HeaderBar from '../../components/HeaderBar';
import StationCard from '../../components/StationCard';
import RecommendationCard from '../../components/RecommendationCard';
import AgentSidePanelModal from '../../components/AgentSidePanelModal';
import { chargingService } from '../../services/chargingService';
import {
  calculateDistanceKm,
  geocodeAddress,
  generatePolylineWaypoints,
  isValidCoordinate,
} from '../../services/routeService';

export default function MobileMapScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { selectedConfig } = useVehicle();
  const { startTrip } = useJourneyContext();

  const mapRef = useRef(null);

  // Default fallback GPS coordinates if location is unacquired
  const gpsLat = location?.coords?.latitude;
  const gpsLon = location?.coords?.longitude;
  const hasGps = isValidCoordinate(gpsLat, gpsLon);

  // Default: Coimbatore -> Chennai (India)
  const defaultSource = {
    name: 'Coimbatore, Tamil Nadu',
    lat: hasGps ? gpsLat : 11.0168,
    lon: hasGps ? gpsLon : 76.9558,
  };
  const defaultDest = {
    name: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lon: 80.2707,
  };

  const [sourceInput, setSourceInput] = useState('Coimbatore, Tamil Nadu');
  const [destInput, setDestInput] = useState('Chennai, Tamil Nadu');

  const [sourceCoords, setSourceCoords] = useState({ lat: defaultSource.lat, lon: defaultSource.lon });
  const [destCoords, setDestCoords] = useState({ lat: defaultDest.lat, lon: defaultDest.lon });

  const [polyline, setPolyline] = useState([]);
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);

  // Initial load
  useEffect(() => {
    handleSearchRoute();
  }, []);

  // Fit map bounds whenever source/dest coords or stations change
  useEffect(() => {
    if (
      mapRef.current &&
      isValidCoordinate(sourceCoords.lat, sourceCoords.lon) &&
      isValidCoordinate(destCoords.lat, destCoords.lon)
    ) {
      const bounds = [
        { latitude: Number(sourceCoords.lat), longitude: Number(sourceCoords.lon) },
        { latitude: Number(destCoords.lat), longitude: Number(destCoords.lon) },
        ...stations.map((st) => ({
          latitude: Number(st.lat || st.latitude),
          longitude: Number(st.lon || st.longitude),
        })),
      ];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(bounds, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 400);
    }
  }, [sourceCoords, destCoords, stations]);

  const handleSearchRoute = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let src = { ...sourceCoords };
      let dst = { ...destCoords };

      // Geocode Source
      if (sourceInput.trim().toLowerCase().includes('current') || sourceInput.trim().toLowerCase().includes('gps')) {
        if (hasGps) {
          src = { lat: gpsLat, lon: gpsLon };
        }
      } else if (sourceInput.trim()) {
        const geoSrc = await geocodeAddress(sourceInput.trim());
        if (geoSrc && isValidCoordinate(geoSrc.lat, geoSrc.lon)) {
          src = { lat: geoSrc.lat, lon: geoSrc.lon };
        }
      }

      // Geocode Destination
      if (destInput.trim()) {
        const geoDst = await geocodeAddress(destInput.trim());
        if (geoDst && isValidCoordinate(geoDst.lat, geoDst.lon)) {
          dst = { lat: geoDst.lat, lon: geoDst.lon };
        }
      }

      if (!isValidCoordinate(src.lat, src.lon) || !isValidCoordinate(dst.lat, dst.lon)) {
        setErrorMsg('Invalid route locations. Please check your addresses and try again.');
        setLoading(false);
        return;
      }

      setSourceCoords(src);
      setDestCoords(dst);

      // Generate route polyline points
      const waypoints = generatePolylineWaypoints(src, dst, 12);
      setPolyline(waypoints);

      // Fetch stations along 10 km route corridor
      const routeStations = await chargingService.getStationsAlongRoute(src, dst, waypoints, 10);
      setStations(routeStations);
    } catch (e) {
      console.warn('[MapScreen] Route search error:', e);
      setErrorMsg('Could not fetch route charging stations.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter((st) => {
    if (filter === 'All') return true;
    if (filter === 'Fast') return (st.powerKw || 0) >= 150;
    if (filter === 'Recommended') return st.isRecommended;
    if (filter === 'Free') return (st.available || 0) > 0;
    return true;
  });

  // Best station recommendation referencing web frontend selection algorithm
  const availableStations = filteredStations.filter((s) => (s.available || s.available_bays || 0) > 0);
  const bestStation = availableStations.reduce((best, curr) => {
    if (!best) return curr;
    if (curr.isRecommended && !best.isRecommended) return curr;
    if ((curr.powerKw || 0) > (best.powerKw || 0) && (curr.distanceKm || 0) <= (best.distanceKm || 0) + 15) return curr;
    return best;
  }, null) || filteredStations[0];

  const dynamicRecommendation = bestStation
    ? `⚡ BEST CHARGING HUB: ${bestStation.name} is ${bestStation.distanceKm.toFixed(1)} km ahead on your route corridor with ${bestStation.available || 2} available ${bestStation.powerKw || 150} kW DC fast charging bays.`
    : '⚡ No suitable charging station found along this route corridor.';

  const handleBookPress = (station) => {
    router.push({
      pathname: '/booking/station',
      params: { stationData: JSON.stringify(station) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        vehicleConfig={selectedConfig}
        connected={true}
        onOpenAgents={() => setIsAgentsOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Source & Destination Search Form */}
        <View style={styles.searchCard}>
          <Text style={styles.label}>📍 SOURCE LOCATION</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={sourceInput}
              onChangeText={setSourceInput}
              placeholder="Source address (e.g. Coimbatore)"
              placeholderTextColor="#71717A"
            />
          </View>

          <Text style={[styles.label, { marginTop: 10 }]}>🎯 DESTINATION LOCATION</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={destInput}
              onChangeText={setDestInput}
              placeholder="Destination address (e.g. Chennai)"
              placeholderTextColor="#71717A"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearchRoute} disabled={loading}>
              <Text style={styles.searchBtnText}>{loading ? '…' : 'SEARCH ↵'}</Text>
            </TouchableOpacity>
          </View>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </View>

        {/* Map View */}
        <View style={styles.mapBox}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: sourceCoords.lat,
              longitude: sourceCoords.lon,
              latitudeDelta: 1.5,
              longitudeDelta: 1.5,
            }}
          >
            {/* Source marker = Cyan */}
            {isValidCoordinate(sourceCoords.lat, sourceCoords.lon) && (
              <Marker coordinate={{ latitude: sourceCoords.lat, longitude: sourceCoords.lon }} title={`Source: ${sourceInput}`} pinColor="#00f0ff" />
            )}

            {/* Destination marker = Red */}
            {isValidCoordinate(destCoords.lat, destCoords.lon) && (
              <Marker coordinate={{ latitude: destCoords.lat, longitude: destCoords.lon }} title={`Destination: ${destInput}`} pinColor="#ff5050" />
            )}

            {/* Route polyline = Green */}
            {polyline.length > 0 && (
              <Polyline
                coordinates={polyline}
                strokeColor="#22c55e"
                strokeWidth={4}
              />
            )}

            {/* Station markers */}
            {filteredStations.map((s, idx) => {
              const latNum = Number(s.lat ?? s.latitude);
              const lonNum = Number(s.lon ?? s.longitude);
              if (!isValidCoordinate(latNum, lonNum)) return null;
              return (
                <Marker
                  key={s.id || idx}
                  coordinate={{ latitude: latNum, longitude: lonNum }}
                  title={`${s.name} (${s.powerKw || s.max_power_kw || 150} kW)`}
                  description={`${(s.distanceKm || s.distance_km || 0).toFixed(1)} km from route start`}
                  pinColor={s.isRecommended ? '#d4d414' : ((s.available || s.available_bays || 0) > 0 ? '#22c55e' : '#3b82f6')}
                />
              );
            })}
          </MapView>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {['All', 'Recommended', 'Fast', 'Free'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f ? styles.filterActive : null]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f ? styles.filterTextActive : null]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Supervisor Recommendation with Real Dynamic Data */}
        <RecommendationCard
          recommendation={dynamicRecommendation}
          sourceAgent="Charging & Supervisor AI Agent"
        />

        {/* Station Cards List */}
        <Text style={styles.sectionTitle}>⚡ ROUTE CHARGING STATIONS ({filteredStations.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#d4d414" style={{ marginTop: 20 }} />
        ) : filteredStations.length === 0 ? (
          <View style={styles.noStationsCard}>
            <Text style={styles.noStationsText}>No suitable charging station found along this route corridor.</Text>
          </View>
        ) : (
          filteredStations.map((st, idx) => (
            <StationCard
              key={st.id || idx}
              station={st}
              isRecommended={st.isRecommended || idx === 0}
              onBookPress={handleBookPress}
            />
          ))
        )}
      </ScrollView>

      <AgentSidePanelModal visible={isAgentsOpen} onClose={() => setIsAgentsOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080805' },
  scrollContent: { padding: 14, paddingBottom: 100 },
  searchCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  label: { color: '#d4d414', fontSize: 9, fontWeight: '800', marginBottom: 6 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#444440',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00f0ff',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchBtnText: { color: '#00f0ff', fontSize: 10, fontWeight: '900' },
  errorText: { color: '#ff5050', fontSize: 11, marginTop: 6, fontWeight: '700' },
  mapBox: {
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    marginBottom: 12,
  },
  map: { width: '100%', height: '100%' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterActive: { backgroundColor: 'rgba(212, 212, 20, 0.15)', borderColor: '#d4d414' },
  filterText: { color: '#999994', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#d4d414', fontWeight: '900' },
  sectionTitle: { color: '#d4d414', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  noStationsCard: {
    backgroundColor: '#111110',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e2e2b',
  },
  noStationsText: { color: '#999994', fontSize: 12, textAlign: 'center', fontWeight: '700' },
});
