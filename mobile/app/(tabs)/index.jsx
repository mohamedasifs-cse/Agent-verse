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
import { useAuth } from '../../context/AuthContext';
import { useVehicle } from '../../context/VehicleContext';
import { useJourneyContext } from '../../context/JourneyContext';
import HeaderBar from '../../components/HeaderBar';
import CockpitHeader from '../../components/CockpitHeader';
import TelemetryRow from '../../components/TelemetryRow';
import LiveRideControls from '../../components/LiveRideControls';
import DriverSafetyPanel from '../../components/DriverSafetyPanel';
import VehicleHealthPanel from '../../components/VehicleHealthPanel';
import AgentSidePanelModal from '../../components/AgentSidePanelModal';
import EmergencyModal from '../../components/EmergencyModal';

export default function MobileDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const {
    vehicleName,
    vehicleType,
    selectedConfig,
    soc,
    soh,
    batteryTemp,
    speedKmh,
    voltage,
    currentAmps,
    distanceDrivenKm,
    estimatedRangeKm,
    setSoc,
  } = useVehicle();

  const { journeyStatus } = useJourneyContext();

  const [isDriving, setIsDriving] = useState(false);
  const [isAntiGravity, setIsAntiGravity] = useState(false);
  const [simMultiplier, setSimMultiplier] = useState(1);
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('vehicle'); // 'vehicle' | 'battery'

  // Driving simulation loop
  useEffect(() => {
    let interval = null;
    if (isDriving) {
      interval = setInterval(() => {
        setSoc((prev) => Math.max(5, +(prev - 0.2 * simMultiplier).toFixed(1)));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isDriving, simMultiplier]);

  // Anti-Gravity charging boost loop
  useEffect(() => {
    let interval = null;
    if (isAntiGravity) {
      interval = setInterval(() => {
        setSoc((prev) => Math.min(100, +(prev + 1.2).toFixed(1)));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isAntiGravity]);

  const activeTelemetry = {
    soc,
    soh,
    temperatureC: batteryTemp,
    speedKmh: isDriving ? 82 * simMultiplier : speedKmh,
    totalDistanceKm: distanceDrivenKm,
    estimatedRangeKm,
    mode: isDriving ? 'driving' : 'idle',
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <HeaderBar
        vehicleConfig={selectedConfig}
        connected={true}
        onOpenAgents={() => setIsAgentsModalOpen(true)}
        onLogout={handleLogout}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cockpit Header */}
        <CockpitHeader soc={soc} range={estimatedRangeKm} stationCount={8} />

        <View style={styles.bodyPadding}>
          {/* 3D / 2D Display Toggle & Card */}
          <View style={styles.vehicleDisplayCard}>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'vehicle' ? styles.toggleActive : null]}
                onPress={() => setViewMode('vehicle')}
              >
                <Text style={[styles.toggleText, viewMode === 'vehicle' ? styles.toggleTextActive : null]}>
                  🚗 Vehicle View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'battery' ? styles.toggleActive : null]}
                onPress={() => setViewMode('battery')}
              >
                <Text style={[styles.toggleText, viewMode === 'battery' ? styles.toggleTextActive : null]}>
                  🔋 Battery View
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.visualContainer}>
              <View style={[styles.glowCircle, { borderColor: selectedConfig.color || '#d4d414' }]}>
                <Text style={styles.visualIcon}>
                  {viewMode === 'vehicle' ? (vehicleType === 'bike' ? '🛵' : '🏎️') : '🔋'}
                </Text>
              </View>
              <Text style={styles.visualName}>{selectedConfig.name}</Text>
              <Text style={styles.visualSub}>
                {viewMode === 'vehicle' ? `${selectedConfig.batteryCapacity} kWh Pack · ${selectedConfig.maxRange} km Range` : `800V High-Voltage Battery Cell Matrix`}
              </Text>
            </View>
          </View>

          {/* Live Ride / Drive Controls */}
          <LiveRideControls
            isDriving={isDriving}
            vehicleType={vehicleType}
            simMultiplier={simMultiplier}
            onToggleDrive={() => setIsDriving(!isDriving)}
            onReset={() => {
              setIsDriving(false);
              setSoc(82);
            }}
            onChangeMultiplier={setSimMultiplier}
            isAntiGravity={isAntiGravity}
            onToggleAntiGravity={() => setIsAntiGravity(!isAntiGravity)}
          />

          {/* Telemetry Row */}
          <TelemetryRow telemetry={activeTelemetry} vehicleConfig={selectedConfig} />

          {/* Driver Behavior & Safety Panel */}
          <DriverSafetyPanel
            telemetry={activeTelemetry}
            isDriving={isDriving}
            vehicleType={vehicleType}
          />

          {/* Vehicle Check & Service Estimator */}
          <VehicleHealthPanel telemetry={activeTelemetry} vehicleName={selectedConfig.name} />
        </View>
      </ScrollView>

      {/* Slide-out Agents Modal */}
      <AgentSidePanelModal
        visible={isAgentsModalOpen}
        onClose={() => setIsAgentsModalOpen(false)}
      />

      {/* Emergency Assistance Modal */}
      <EmergencyModal visible={soc <= 10} onClose={() => {}} soc={soc} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bodyPadding: {
    padding: 14,
  },
  vehicleDisplayCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#2e2e2b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#1e1e1b',
    borderWidth: 1,
    borderColor: '#444440',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: 'rgba(212, 212, 20, 0.15)',
    borderColor: '#d4d414',
  },
  toggleText: {
    color: '#999994',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#d4d414',
    fontWeight: '900',
  },
  visualContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  glowCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  visualIcon: {
    fontSize: 42,
  },
  visualName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  visualSub: {
    color: '#999994',
    fontSize: 11,
    marginTop: 2,
  },
});
