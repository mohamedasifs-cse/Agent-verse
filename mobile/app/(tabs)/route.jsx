import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useVehicle } from '../../context/VehicleContext';
import { useJourneyContext } from '../../context/JourneyContext';
import { chargingService } from '../../services/chargingService';
import {
  calculateDistanceKm,
  calculateEtaMinutes,
  geocodeAddress,
  generatePolylineWaypoints,
  isValidCoordinate,
} from '../../services/routeService';

export default function RouteScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { estimatedRangeKm } = useVehicle();
  const { startTrip } = useJourneyContext();

  const mapRef = useRef(null);

  const gpsLat = location?.coords?.latitude;
  const gpsLon = location?.coords?.longitude;
  const hasGps = isValidCoordinate(gpsLat, gpsLon);

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

  const [sourceText, setSourceText] = useState('Coimbatore, Tamil Nadu');
  const [destinationText, setDestinationText] = useState('Chennai, Tamil Nadu');

  const [sourceCoords, setSourceCoords] = useState({ lat: defaultSource.lat, lon: defaultSource.lon });
  const [destCoords, setDestCoords] = useState({ lat: defaultDest.lat, lon: defaultDest.lon });

  const [polyline, setPolyline] = useState([]);
  const [routeChargers, setRouteChargers] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: calculateDistanceKm(defaultSource.lat, defaultSource.lon, defaultDest.lat, defaultDest.lon),
    etaMinutes: calculateEtaMinutes(calculateDistanceKm(defaultSource.lat, defaultSource.lon, defaultDest.lat, defaultDest.lon), 50),
    remainingRangeAfterKm: Math.max(0, estimatedRangeKm - Math.round(calculateDistanceKm(defaultSource.lat, defaultSource.lon, defaultDest.lat, defaultDest.lon))),
  });

  useEffect(() => {
    handleCalculateRoute();
  }, []);

  useEffect(() => {
    if (
      mapRef.current &&
      isValidCoordinate(sourceCoords.lat, sourceCoords.lon) &&
      isValidCoordinate(destCoords.lat, destCoords.lon)
    ) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: sourceCoords.lat, longitude: sourceCoords.lon },
            { latitude: destCoords.lat, longitude: destCoords.lon },
          ],
          {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true,
          }
        );
      }, 400);
    }
  }, [sourceCoords, destCoords]);

  const handleCalculateRoute = async () => {
    setIsCalculating(true);
    setErrorMsg('');
    try {
      let src = { ...sourceCoords };
      let dst = { ...destCoords };

      if (sourceText.trim().toLowerCase().includes('current') || sourceText.trim().toLowerCase().includes('gps')) {
        if (hasGps) {
          src = { lat: gpsLat, lon: gpsLon };
        }
      } else if (sourceText.trim()) {
        const geoSrc = await geocodeAddress(sourceText.trim());
        if (geoSrc && isValidCoordinate(geoSrc.lat, geoSrc.lon)) {
          src = { lat: geoSrc.lat, lon: geoSrc.lon };
        }
      }

      if (destinationText.trim()) {
        const geoDst = await geocodeAddress(destinationText.trim());
        if (geoDst && isValidCoordinate(geoDst.lat, geoDst.lon)) {
          dst = { lat: geoDst.lat, lon: geoDst.lon };
        }
      }

      if (!isValidCoordinate(src.lat, src.lon) || !isValidCoordinate(dst.lat, dst.lon)) {
        setErrorMsg('Invalid coordinates. Please enter valid locations.');
        setIsCalculating(false);
        return;
      }

      setSourceCoords(src);
      setDestCoords(dst);

      const waypoints = generatePolylineWaypoints(src, dst, 12);
      setPolyline(waypoints);

      const dist = calculateDistanceKm(src.lat, src.lon, dst.lat, dst.lon);
      const eta = calculateEtaMinutes(dist, 50);

      setRouteInfo({
        distanceKm: dist,
        etaMinutes: eta,
        remainingRangeAfterKm: Math.max(0, estimatedRangeKm - Math.round(dist)),
      });

      // Fetch route chargers
      const chargers = await chargingService.getStationsAlongRoute(src, dst, waypoints, 10);
      setRouteChargers(chargers);
    } catch (err) {
      console.warn('[RoutePlanner] Route calculation error:', err);
      setErrorMsg('Geocoding failed. Please check route address.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStartTrip = () => {
    startTrip(
      { lat: sourceCoords.lat, lon: sourceCoords.lon, name: sourceText },
      { lat: destCoords.lat, lon: destCoords.lon, name: destinationText },
      routeInfo.distanceKm,
      routeInfo.etaMinutes
    );
    router.push('/(tabs)/journey');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map View */}
        <View style={styles.mapContainer}>
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
            {/* Source = Cyan */}
            {isValidCoordinate(sourceCoords.lat, sourceCoords.lon) && (
              <Marker
                coordinate={{ latitude: sourceCoords.lat, longitude: sourceCoords.lon }}
                title={`Source: ${sourceText}`}
                pinColor="#00F0FF"
              />
            )}

            {/* Destination = Red */}
            {isValidCoordinate(destCoords.lat, destCoords.lon) && (
              <Marker
                coordinate={{ latitude: destCoords.lat, longitude: destCoords.lon }}
                title={`Destination: ${destinationText}`}
                pinColor="#EF4444"
              />
            )}

            {/* Polyline Route = Green */}
            {polyline.length > 0 && (
              <Polyline
                coordinates={polyline}
                strokeColor="#22C55E"
                strokeWidth={4}
              />
            )}

            {/* Route Chargers Markers */}
            {routeChargers.map((c, idx) => (
              <Marker
                key={c.id || idx}
                coordinate={{ latitude: parseFloat(c.lat), longitude: parseFloat(c.lon) }}
                title={c.name}
                description={`${c.powerKw || 150} kW DC · ${c.available || 2} bays free`}
                pinColor={
                  c.isRecommended
                    ? '#FACC15'
                    : (c.available || 0) > 0
                    ? '#22C55E'
                    : '#3B82F6'
                }
              />
            ))}
          </MapView>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#00F0FF' }]} />
            <Text style={styles.legendText}>EV (Cyan)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Route (Green)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Dest (Red)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#FACC15' }]} />
            <Text style={styles.legendText}>Best (Yellow)</Text>
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.formCard}>
          <Text style={styles.label}>📍 SOURCE</Text>
          <TextInput
            style={styles.input}
            value={sourceText}
            onChangeText={setSourceText}
            placeholder="Current location"
            placeholderTextColor="#71717A"
          />

          <Text style={styles.label}>🎯 DESTINATION</Text>
          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={setDestinationText}
            placeholder="Search destination"
            placeholderTextColor="#71717A"
          />

          <TouchableOpacity
            style={styles.calcBtn}
            onPress={handleCalculateRoute}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <ActivityIndicator color="#080805" />
            ) : (
              <Text style={styles.calcBtnText}>CALCULATE ROUTE ➔</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Calculated Info Card */}
        {routeInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValYellow}>{routeInfo.distanceKm} km</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Est. ETA</Text>
                <Text style={styles.infoValCyan}>{routeInfo.etaMinutes} mins</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Range Left</Text>
                <Text style={styles.infoVal}>{routeInfo.remainingRangeAfterKm} km</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartTrip}>
              <Text style={styles.startBtnText}>START LIVE JOURNEY ➔</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 0, 0.3)',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111110',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#111110',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  label: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  calcBtn: {
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#DFFF00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  calcBtnText: {
    color: '#DFFF00',
    fontSize: 12,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  infoValYellow: {
    color: '#DFFF00',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  infoValCyan: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
  },
});
