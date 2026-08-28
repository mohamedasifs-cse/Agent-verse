import React, { createContext, useContext, useState } from 'react';

const JourneyContext = createContext();

export function JourneyProvider({ children }) {
  const [activeTrip, setActiveTrip] = useState(null); // { origin, destination, distanceKm, etaMinutes, routeGeojson }
  const [bookedSlot, setBookedSlot] = useState(null); // { stationId, stationName, slotTime, lat, lon, isArrived, arrivalRadiusMeters }
  const [journeyStatus, setJourneyStatus] = useState('IDLE'); // 'IDLE' | 'NAVIGATING' | 'STATION_ARRIVED' | 'CHARGING' | 'COMPLETED'
  const [arrivalRadiusMeters, setArrivalRadiusMeters] = useState(150); // Configurable GPS radius in meters
  const [aiAnalysis, setAiAnalysis] = useState(null); // Output from Supervisor / 12 agents
  const [agentLogs, setAgentLogs] = useState([]);

  const startTrip = (origin, destination, distanceKm, etaMinutes) => {
    setActiveTrip({
      origin: origin || { lat: 37.7749, lon: -122.4194, name: 'Current EV Location' },
      destination: destination || { lat: 37.7833, lon: -122.4167, name: 'Downtown EV Center' },
      distanceKm: distanceKm || 12.5,
      etaMinutes: etaMinutes || 18,
      startTime: new Date().toISOString(),
    });
    setJourneyStatus('NAVIGATING');
  };

  const bookChargingSlot = (station, timeSlot) => {
    const booking = {
      id: `booking_${Date.now()}`,
      stationId: station.id,
      stationName: station.name,
      lat: station.lat,
      lon: station.lon,
      connectors: station.connectors || ['CCS2'],
      powerKw: station.powerKw || 150,
      slotTime: timeSlot || '10:30 AM',
      bookingDate: new Date().toISOString().split('T')[0],
      isArrived: false,
    };
    setBookedSlot(booking);
    return booking;
  };

  const markArrivedAtStation = () => {
    if (bookedSlot) {
      setBookedSlot(prev => ({ ...prev, isArrived: true }));
      setJourneyStatus('STATION_ARRIVED');
    }
  };

  const clearTrip = () => {
    setActiveTrip(null);
    setBookedSlot(null);
    setJourneyStatus('IDLE');
  };

  return (
    <JourneyContext.Provider
      value={{
        activeTrip,
        bookedSlot,
        journeyStatus,
        arrivalRadiusMeters,
        aiAnalysis,
        agentLogs,
        setArrivalRadiusMeters,
        setJourneyStatus,
        setAiAnalysis,
        setAgentLogs,
        startTrip,
        bookChargingSlot,
        markArrivedAtStation,
        clearTrip,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourneyContext() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourneyContext must be used within a JourneyProvider');
  }
  return context;
}
