import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVehicle } from '../../context/VehicleContext';
import HeaderBar from '../../components/HeaderBar';
import ReportsPanel from '../../components/ReportsPanel';
import AgentSidePanelModal from '../../components/AgentSidePanelModal';

export default function MobileReportsScreen() {
  const { selectedConfig, soc, distanceDrivenKm } = useVehicle();
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);

  const telemetry = {
    soc,
    totalDistanceKm: distanceDrivenKm,
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        vehicleConfig={selectedConfig}
        connected={true}
        onOpenAgents={() => setIsAgentsOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ReportsPanel telemetry={telemetry} vehicleName={selectedConfig.name} />
      </ScrollView>

      <AgentSidePanelModal visible={isAgentsOpen} onClose={() => setIsAgentsOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080805' },
  scrollContent: { padding: 14, paddingBottom: 100 },
});
