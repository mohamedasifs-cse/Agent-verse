import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useVehicle } from '../../context/VehicleContext';
import { chargingService } from '../../services/chargingService';

const SIMULATION_STEPS = [24, 35, 50, 70, 85, 100];

export default function BoostUpScreen() {
  const router = useRouter();
  const { soc, setSoc, selectedConfig } = useVehicle();

  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulatedSoc, setSimulatedSoc] = useState(soc < 25 ? soc : 24);
  const [energyAdded, setEnergyAdded] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [cost, setCost] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startSimulation = () => {
    setIsSimulating(true);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setSimulatedSoc(SIMULATION_STEPS[0]);
    setEnergyAdded(2.5);
    setDurationMinutes(3);
    setCost(1.2);
  };

  useEffect(() => {
    let timer = null;
    if (isSimulating && currentStepIndex < SIMULATION_STEPS.length - 1) {
      timer = setTimeout(() => {
        const nextIdx = currentStepIndex + 1;
        const nextSoc = SIMULATION_STEPS[nextIdx];
        setCurrentStepIndex(nextIdx);
        setSimulatedSoc(nextSoc);

        const capacity = selectedConfig.batteryCapacity || 75.0;
        const addedKwh = parseFloat((((nextSoc - SIMULATION_STEPS[0]) / 100) * capacity).toFixed(1));
        const duration = nextIdx * 4;
        const totalCost = parseFloat((addedKwh * 0.35).toFixed(2));

        setEnergyAdded(addedKwh);
        setDurationMinutes(duration);
        setCost(totalCost);

        if (nextIdx === SIMULATION_STEPS.length - 1) {
          setIsSimulating(false);
          setIsCompleted(true);
          setSoc(100);

          // Save completed session to backend
          chargingService.createChargingSession({
            vehicleId: selectedConfig.name,
            stationName: 'Boost Up Simulated Charger',
            energyKwh: addedKwh,
            cost: totalCost,
            durationMinutes: duration,
            startSoc: SIMULATION_STEPS[0],
            endSoc: 100,
          });
        }
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, currentStepIndex]);

  const estimatedRangeNow = Math.round((simulatedSoc / 100) * selectedConfig.maxRange);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Warning: CHARGING SIMULATION */}
        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerTag}>⚠️ CHARGING SIMULATION</Text>
          <Text style={styles.disclaimerText}>
            Notice: This tool is an interactive software demonstration and simulation. It does not represent real physical current flow.
          </Text>
        </View>

        {/* Battery Fill Box */}
        <View style={styles.simCard}>
          <Text style={styles.simHeader}>BOOST UP POWER PROGRESS</Text>
          <Text style={styles.socBig}>{simulatedSoc}%</Text>

          {/* Step visual indicator */}
          <View style={styles.stepRow}>
            {SIMULATION_STEPS.map((stepVal, idx) => (
              <View
                key={stepVal}
                style={[
                  styles.stepDot,
                  simulatedSoc >= stepVal ? styles.stepDotActive : null,
                ]}
              >
                <Text style={styles.stepText}>{stepVal}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${simulatedSoc}%` },
              ]}
            />
          </View>

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Charging Speed</Text>
              <Text style={styles.mValYellow}>
                {isSimulating ? '150 kW DC' : '0 kW'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Energy Added</Text>
              <Text style={styles.mValCyan}>{energyAdded} kWh</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Duration</Text>
              <Text style={styles.mVal}>{durationMinutes} mins</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Estimated Cost</Text>
              <Text style={styles.mValYellow}>${cost}</Text>
            </View>

            <View style={styles.metricItemFull}>
              <Text style={styles.mLabel}>Updated Range Estimation</Text>
              <Text style={styles.mValCyan}>{estimatedRangeNow} km</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {!isSimulating && !isCompleted && (
          <TouchableOpacity style={styles.startBtn} onPress={startSimulation}>
            <Text style={styles.startBtnText}>START BOOST UP SIMULATION ⚡</Text>
          </TouchableOpacity>
        )}

        {isSimulating && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#DFFF00" />
            <Text style={styles.loadingText}>Simulating Fast Charging Sequence...</Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBox}>
            <Text style={styles.completedTitle}>⚡ SIMULATION COMPLETE (100% SOC)</Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.doneBtnText}>RETURN TO DASHBOARD ➔</Text>
            </TouchableOpacity>
          </View>
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
  },
  disclaimerBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerTag: {
    color: '#EAB308',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  disclaimerText: {
    color: '#FEF08A',
    fontSize: 11,
    lineHeight: 16,
  },
  simCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(223, 255, 0, 0.3)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  simHeader: {
    color: '#DFFF00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  socBig: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 14,
  },
  stepDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepDotActive: {
    backgroundColor: 'rgba(223, 255, 0, 0.2)',
    borderColor: '#DFFF00',
  },
  stepText: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DFFF00',
    borderRadius: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    width: '100%',
  },
  metricItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricItemFull: {
    width: '100%',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    alignItems: 'center',
  },
  mLabel: { color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  mVal: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  mValYellow: { color: '#DFFF00', fontSize: 14, fontWeight: '800', marginTop: 2 },
  mValCyan: { color: '#00F0FF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  startBtn: {
    backgroundColor: '#DFFF00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#080805',
    fontSize: 14,
    fontWeight: '900',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#DFFF00',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  completedBox: {
    alignItems: 'center',
  },
  completedTitle: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  doneBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
  },
});
