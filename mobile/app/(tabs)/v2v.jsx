import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVehicle } from '../../context/VehicleContext';
import HeaderBar from '../../components/HeaderBar';
import V2VTransferPanel from '../../components/V2VTransferPanel';
import AgentSidePanelModal from '../../components/AgentSidePanelModal';

export default function MobileV2VScreen() {
  const { selectedConfig, soc } = useVehicle();
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        vehicleConfig={selectedConfig}
        connected={true}
        onOpenAgents={() => setIsAgentsOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <V2VTransferPanel soc={soc} />
      </ScrollView>

      <AgentSidePanelModal visible={isAgentsOpen} onClose={() => setIsAgentsOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080805' },
  scrollContent: { padding: 14, paddingBottom: 100 },
});
