import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useVehicle } from '../../context/VehicleContext';

export default function VehicleSelectScreen() {
  const router = useRouter();
  const { vehicleName, vehicleType, presets, selectVehicle } = useVehicle();
  const [selectedType, setSelectedType] = useState(vehicleType || 'car');

  const filteredPresetKeys = Object.keys(presets).filter(
    (key) => presets[key].type === selectedType
  );

  const handleSelect = (key) => {
    selectVehicle(key, selectedType);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>SELECT YOUR ELECTRIC VEHICLE</Text>
        <Text style={styles.subtitle}>
          Choose your active EV Car or Electric Scooter model to update telemetry metrics
        </Text>

        {/* Type Toggle Tabs */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              selectedType === 'car' ? styles.toggleTabActive : null,
            ]}
            onPress={() => setSelectedType('car')}
          >
            <Text
              style={[
                styles.toggleText,
                selectedType === 'car' ? styles.toggleTextActive : null,
              ]}
            >
              🚗 ELECTRIC CARS ({Object.keys(presets).filter(k => presets[k].type === 'car').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleTab,
              selectedType === 'bike' ? styles.toggleTabActive : null,
            ]}
            onPress={() => setSelectedType('bike')}
          >
            <Text
              style={[
                styles.toggleText,
                selectedType === 'bike' ? styles.toggleTextActive : null,
              ]}
            >
              🛵 ELECTRIC BIKES ({Object.keys(presets).filter(k => presets[k].type === 'bike').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Models */}
        {filteredPresetKeys.map((key) => {
          const item = presets[key];
          const isSelected = vehicleName === key;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.itemCard, isSelected ? styles.itemCardSelected : null]}
              onPress={() => handleSelect(key)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.itemTitleBox}>
                  <Text style={styles.itemName}>{key}</Text>
                  <Text style={styles.itemSub}>
                    {item.batteryCapacity} kWh · Max Range: {item.maxRange} km
                  </Text>
                </View>
                {isSelected && <Text style={styles.checkBadge}>✓ ACTIVE</Text>}
              </View>

              <View style={styles.itemSpecsRow}>
                <Text style={styles.specChip}>⚡ {item.batteryCapacity} kWh</Text>
                <Text style={styles.specChipCyan}>📍 {item.maxRange} km</Text>
                <Text style={styles.specChipYellow}>⏱️ {item.chargingTime}</Text>
                <Text style={styles.specChip}>🚀 {item.topSpeed} km/h</Text>
              </View>
            </TouchableOpacity>
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
  title: {
    color: '#DFFF00',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111110',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleTabActive: {
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#DFFF00',
  },
  toggleText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#DFFF00',
  },
  itemCard: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itemCardSelected: {
    borderColor: '#DFFF00',
    borderWidth: 2,
    backgroundColor: 'rgba(223, 255, 0, 0.04)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  itemTitleBox: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  itemSub: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },
  checkBadge: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  specChip: {
    color: '#E4E4E7',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specChipCyan: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specChipYellow: {
    color: '#DFFF00',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(223, 255, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
