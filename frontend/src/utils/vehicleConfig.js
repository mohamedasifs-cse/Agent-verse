/**
 * Vehicle Configuration System
 * Centralized registry of specifications, images, battery metrics, top speeds, and charge times
 * for Electric Cars and Electric Bikes/Scooters.
 */

export const vehicleConfig = {
  "Porsche Taycan EV": {
    type: "car",
    image: "/vehicles/porsche-taycan.png",
    fallbackImage: "/vehicles/ev_car.png",
    batteryCapacity: 93.4,
    maxRange: 484,
    topSpeed: 260,
    chargingTime: "22 min",
    batteryTemp: 25,
    color: "#DFFF00",
  },

  "Tata Nexon EV": {
    type: "car",
    image: "/vehicles/tata-nexon.png",
    fallbackImage: "/vehicles/tata_safari_ev.png",
    batteryCapacity: 40.5,
    maxRange: 465,
    topSpeed: 150,
    chargingTime: "56 min",
    batteryTemp: 25,
    color: "#00F0FF",
  },

  "Tata Punch EV": {
    type: "car",
    image: "/vehicles/tata-punch.png",
    fallbackImage: "/vehicles/tata_safari_ev.png",
    batteryCapacity: 35.0,
    maxRange: 315,
    topSpeed: 140,
    chargingTime: "50 min",
    batteryTemp: 25,
    color: "#38BDF8",
  },

  "Mahindra XUV400": {
    type: "car",
    image: "/vehicles/xuv400.png",
    fallbackImage: "/vehicles/ev_car.png",
    batteryCapacity: 39.4,
    maxRange: 456,
    topSpeed: 150,
    chargingTime: "50 min",
    batteryTemp: 25,
    color: "#FACC15",
  },

  "MG ZS EV": {
    type: "car",
    image: "/vehicles/mg-zs.png",
    fallbackImage: "/vehicles/ev_car.png",
    batteryCapacity: 50.3,
    maxRange: 461,
    topSpeed: 175,
    chargingTime: "42 min",
    batteryTemp: 25,
    color: "#E11D48",
  },

  "Ola S1 Pro": {
    type: "bike",
    image: "/vehicles/ola-s1-pro.jpg",
    fallbackImage: "/vehicles/ola-s1-pro.jpg",
    batteryCapacity: 4,
    maxRange: 176,
    topSpeed: 120,
    chargingTime: "6 hr",
    batteryTemp: 28,
    color: "#22C55E",
  },

  "Ather 450X": {
    type: "bike",
    image: "/vehicles/ather-450x.png",
    fallbackImage: "/vehicles/ola-s1-pro.jpg",
    batteryCapacity: 3.7,
    maxRange: 161,
    topSpeed: 90,
    chargingTime: "5.4 hr",
    batteryTemp: 27,
    color: "#38BDF8",
  },

  "TVS iQube": {
    type: "bike",
    image: "/vehicles/tvs-iqube.png",
    fallbackImage: "/vehicles/ola-s1-pro.jpg",
    batteryCapacity: 3.4,
    maxRange: 145,
    topSpeed: 78,
    chargingTime: "4.5 hr",
    batteryTemp: 26,
    color: "#A855F7",
  },

  "Bajaj Chetak": {
    type: "bike",
    image: "/vehicles/chetak.jpg",
    fallbackImage: "/vehicles/chetak.jpg",
    batteryCapacity: 3.2,
    maxRange: 153,
    topSpeed: 73,
    chargingTime: "5 hr",
    batteryTemp: 26,
    color: "#F59E0B",
  },

  "Hero Vida V1": {
    type: "bike",
    image: "/vehicles/hero-vida.png",
    fallbackImage: "/vehicles/ola-s1-pro.jpg",
    batteryCapacity: 3.9,
    maxRange: 165,
    topSpeed: 80,
    chargingTime: "5.8 hr",
    batteryTemp: 27,
    color: "#EC4899",
  },

  "Simple One": {
    type: "bike",
    image: "/vehicles/simple-one.png",
    fallbackImage: "/vehicles/ola-s1-pro.jpg",
    batteryCapacity: 5.0,
    maxRange: 212,
    topSpeed: 105,
    chargingTime: "5.5 hr",
    batteryTemp: 28,
    color: "#10B981",
  },
};

/**
 * Safely retrieve configuration for any vehicle model name.
 * Falls back dynamically for newly inserted or custom vehicle names.
 */
export function getVehicleConfig(vehicleName = '', vehicleType = 'car') {
  if (vehicleName && vehicleConfig[vehicleName]) {
    return { name: vehicleName, ...vehicleConfig[vehicleName] };
  }

  // Case-insensitive lookup match
  const lowerName = (vehicleName || '').toLowerCase();
  const matchedKey = Object.keys(vehicleConfig).find(
    k => k.toLowerCase() === lowerName
  );
  if (matchedKey) {
    return { name: matchedKey, ...vehicleConfig[matchedKey] };
  }

  // Dynamic fallback for custom/new vehicle models
  const isBike = vehicleType === 'bike' || lowerName.includes('bike') || lowerName.includes('scooter') || lowerName.includes('ola') || lowerName.includes('ather');
  return {
    name: vehicleName || (isBike ? 'Ola S1 Pro' : 'Porsche Taycan EV'),
    type: isBike ? 'bike' : 'car',
    image: isBike ? '/vehicles/ola-s1-pro.jpg' : '/vehicles/porsche-taycan.png',
    fallbackImage: isBike ? '/vehicles/ola-s1-pro.jpg' : '/vehicles/ev_car.png',
    batteryCapacity: isBike ? 4.0 : 75.0,
    maxRange: isBike ? 150 : 450,
    topSpeed: isBike ? 95 : 180,
    chargingTime: isBike ? '5 hr' : '45 min',
    batteryTemp: 25,
    color: '#DFFF00',
  };
}
