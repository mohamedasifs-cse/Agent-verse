import React, { createContext, useContext, useState, useMemo } from 'react';

const VEHICLE_PRESETS = {
  // Electric Cars
  'Porsche Taycan EV': {
    type: 'car',
    batteryCapacity: 93.4,
    maxRange: 484,
    topSpeed: 260,
    chargingTime: '22 min',
    batteryTemp: 25,
    color: '#DFFF00',
    icon: '🚗',
  },
  'Tata Nexon EV': {
    type: 'car',
    batteryCapacity: 40.5,
    maxRange: 465,
    topSpeed: 150,
    chargingTime: '56 min',
    batteryTemp: 25,
    color: '#00F0FF',
    icon: '⚡',
  },
  'Tata Punch EV': {
    type: 'car',
    batteryCapacity: 35.0,
    maxRange: 315,
    topSpeed: 140,
    chargingTime: '50 min',
    batteryTemp: 25,
    color: '#38BDF8',
    icon: '🚙',
  },
  'Mahindra XUV400': {
    type: 'car',
    batteryCapacity: 39.4,
    maxRange: 456,
    topSpeed: 150,
    chargingTime: '50 min',
    batteryTemp: 25,
    color: '#FACC15',
    icon: '🏎️',
  },
  'MG ZS EV': {
    type: 'car',
    batteryCapacity: 50.3,
    maxRange: 461,
    topSpeed: 175,
    chargingTime: '42 min',
    batteryTemp: 25,
    color: '#E11D48',
    icon: '🚘',
  },

  // Electric Bikes / Scooters
  'Ola S1 Pro': {
    type: 'bike',
    batteryCapacity: 4.0,
    maxRange: 176,
    topSpeed: 120,
    chargingTime: '6 hr',
    batteryTemp: 28,
    color: '#22C55E',
    icon: '🛵',
  },
  'Ather 450X': {
    type: 'bike',
    batteryCapacity: 3.7,
    maxRange: 161,
    topSpeed: 90,
    chargingTime: '5.4 hr',
    batteryTemp: 27,
    color: '#38BDF8',
    icon: '🏍️',
  },
  'TVS iQube': {
    type: 'bike',
    batteryCapacity: 3.4,
    maxRange: 145,
    topSpeed: 78,
    chargingTime: '4.5 hr',
    batteryTemp: 26,
    color: '#A855F7',
    icon: '🛴',
  },
  'Bajaj Chetak': {
    type: 'bike',
    batteryCapacity: 3.2,
    maxRange: 153,
    topSpeed: 73,
    chargingTime: '5 hr',
    batteryTemp: 26,
    color: '#F59E0B',
    icon: '🛵',
  },
  'Hero Vida V1': {
    type: 'bike',
    batteryCapacity: 3.9,
    maxRange: 165,
    topSpeed: 80,
    chargingTime: '5.8 hr',
    batteryTemp: 27,
    color: '#EC4899',
    icon: '🏍️',
  },
  'Simple One': {
    type: 'bike',
    batteryCapacity: 5.0,
    maxRange: 212,
    topSpeed: 105,
    chargingTime: '5.5 hr',
    batteryTemp: 28,
    color: '#10B981',
    icon: '🛵',
  },
};

const VehicleContext = createContext();

export function VehicleProvider({ children }) {
  const [vehicleName, setVehicleName] = useState('Porsche Taycan EV');
  const [vehicleType, setVehicleType] = useState('car'); // 'car' | 'bike'
  
  // Live dynamic telemetry metrics
  const [soc, setSoc] = useState(82); // Battery percentage %
  const [soh, setSoh] = useState(96); // State of Health %
  const [batteryTemp, setBatteryTemp] = useState(26); // °C
  const [speedKmh, setSpeedKmh] = useState(0); // km/h
  const [voltage, setVoltage] = useState(380); // V
  const [currentAmps, setCurrentAmps] = useState(12); // A
  const [distanceDrivenKm, setDistanceDrivenKm] = useState(42.5); // km

  const selectedConfig = useMemo(() => {
    if (VEHICLE_PRESETS[vehicleName]) {
      return { name: vehicleName, ...VEHICLE_PRESETS[vehicleName] };
    }
    const isBike = vehicleType === 'bike';
    return {
      name: vehicleName || (isBike ? 'Ola S1 Pro' : 'Porsche Taycan EV'),
      type: isBike ? 'bike' : 'car',
      batteryCapacity: isBike ? 4.0 : 75.0,
      maxRange: isBike ? 150 : 450,
      topSpeed: isBike ? 95 : 180,
      chargingTime: isBike ? '5 hr' : '45 min',
      batteryTemp: 25,
      color: '#DFFF00',
      icon: isBike ? '🛵' : '🚗',
    };
  }, [vehicleName, vehicleType]);

  // Dynamically calculated estimated remaining range based on SoC and max range
  const estimatedRangeKm = useMemo(() => {
    return Math.round((soc / 100) * selectedConfig.maxRange);
  }, [soc, selectedConfig.maxRange]);

  const selectVehicle = (name, type) => {
    setVehicleName(name);
    if (type) {
      setVehicleType(type);
    } else if (VEHICLE_PRESETS[name]) {
      setVehicleType(VEHICLE_PRESETS[name].type);
    }
  };

  const updateTelemetry = (newTelemetry) => {
    if (newTelemetry.soc !== undefined) setSoc(newTelemetry.soc);
    if (newTelemetry.soh !== undefined) setSoh(newTelemetry.soh);
    if (newTelemetry.temperatureC !== undefined) setBatteryTemp(newTelemetry.temperatureC);
    if (newTelemetry.speedKmh !== undefined) setSpeedKmh(newTelemetry.speedKmh);
    if (newTelemetry.voltage !== undefined) setVoltage(newTelemetry.voltage);
    if (newTelemetry.currentAmps !== undefined) setCurrentAmps(newTelemetry.currentAmps);
    if (newTelemetry.totalDistanceKm !== undefined) setDistanceDrivenKm(newTelemetry.totalDistanceKm);
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicleName,
        vehicleType,
        selectedConfig,
        presets: VEHICLE_PRESETS,
        soc,
        soh,
        batteryTemp,
        speedKmh,
        voltage,
        currentAmps,
        distanceDrivenKm,
        estimatedRangeKm,
        selectVehicle,
        setVehicleType,
        setSoc,
        setSoh,
        setBatteryTemp,
        updateTelemetry,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}
