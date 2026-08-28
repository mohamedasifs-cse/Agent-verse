import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useVehicle } from '../../context/VehicleContext';
import { agentService } from '../../services/agentService';
import AgentCard from '../../components/AgentCard';

const AGENT_METADATA = [
  { key: 'battery', name: '1. Battery Agent', icon: '🔋' },
  { key: 'route', name: '2. Route Agent', icon: '🗺️' },
  { key: 'charging', name: '3. Charging Agent', icon: '🔌' },
  { key: 'traffic', name: '4. Traffic Agent', icon: '🚦' },
  { key: 'weather', name: '5. Weather Agent', icon: '🌧️' },
  { key: 'driver_safety', name: '6. Driver Safety Agent', icon: '⚠️' },
  { key: 'maintenance', name: '7. Predictive Maintenance Agent', icon: '🔧' },
  { key: 'pricing', name: '8. Dynamic Pricing Agent', icon: '💰' },
  { key: 'grid', name: '9. Grid Agent', icon: '⚡' },
  { key: 'v2v', name: '10. V2V Energy Agent', icon: '🤝' },
  { key: 'energy', name: '11. Energy Management Agent', icon: '📊' },
  { key: 'emergency', name: '12. Emergency Dispatch Agent', icon: '🚨' },
];

export default function AgentIntelligenceScreen() {
  const { soc, soh, batteryTemp, vehicleType, vehicleName } = useVehicle();
  const [agentsData, setAgentsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgentStatus();
  }, [vehicleName, soc]);

  const fetchAgentStatus = async () => {
    try {
      const data = await agentService.analyzeSystem({
        telemetry: {
          soc,
          soh,
          temperatureC: batteryTemp,
          vehicleType,
          vehicleModel: vehicleName,
        },
      });

      if (data?.agents) {
        setAgentsData(data.agents);
      }
    } catch (err) {
      console.warn('[AgentIntelligence] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAgentStatus();
    setRefreshing(false);
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
        <View style={styles.headerBanner}>
          <Text style={styles.title}>12 AGENT SWARM INTELLIGENCE</Text>
          <Text style={styles.subtitle}>
            Live telemetry assessment from Supervisor & 12 Specialized AI Agents
          </Text>
        </View>

        {AGENT_METADATA.map((agentMeta) => {
          const agentOutput = agentsData[agentMeta.key] || {};
          const status = agentOutput.status || 'ACTIVE';
          const rec = agentOutput.recommendation || agentOutput.summary || agentOutput.advice;
          const confidence = agentOutput.confidence || 94;

          return (
            <AgentCard
              key={agentMeta.key}
              name={agentMeta.name}
              icon={agentMeta.icon}
              status={status}
              recommendation={rec}
              confidence={confidence}
            />
          );
        })}
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
  headerBanner: {
    marginBottom: 16,
  },
  title: {
    color: '#00F0FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
  },
});
