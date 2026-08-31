import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { generateNearbyStations, fetchRealStationsFromOSM, fetchRealStationsFromOCM, deduplicateStations } from '../utils/routeStationCalculator';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export function useEVSystem() {
  const [telemetry, setTelemetry] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [agentLog, setAgentLog] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Booking & Queue state
  const [userBookings, setUserBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [stationSlots, setStationSlots] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const socketRef = useRef(null);
  const liveLogRef = useRef([]);

  // Always-current refs — avoids stale closure in runAnalysis
  const telemetryRef = useRef(null);
  const vehicleIdRef = useRef(null);

  const fetchUserBookings = useCallback(async (userId = 'demo') => {
    try {
      const res = await axios.get(`${API_BASE}/bookings`, { params: { userId } });
      const bookings = res.data || [];
      setUserBookings(bookings);
      const active = bookings.find(b => ['BOOKED', 'WAITING', 'CHARGING'].includes(b.status));
      setActiveBooking(active || null);
      return bookings;
    } catch (e) {
      console.warn('[useEVSystem] Failed to fetch user bookings:', e);
      return [];
    }
  }, []);

  // ── Socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      fetchUserBookings();
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('simulator:ready', ({ vehicleId: vid, telemetry: t }) => {
      vehicleIdRef.current = vid;
      telemetryRef.current = t;
      setVehicleId(vid);
      setTelemetry(t);
    });

    socket.on('telemetry:latest', (data) => {
      telemetryRef.current = data;
      setTelemetry(data);
    });

    socket.on('agent:start', ({ agent }) => {
      setActiveAgents(prev => [...new Set([...prev, agent])]);
    });

    socket.on('agent:update', (entry) => {
      liveLogRef.current = [...liveLogRef.current, entry];
      setAgentLog([...liveLogRef.current]);
      setActiveAgents(prev => prev.filter(a => a !== entry.agent));
    });

    socket.on('agent:complete', () => {
      setActiveAgents([]);
    });

    // ── Live Booking & Queue Socket Updates ──
    socket.on('queue:updated', ({ stationId, queueCount, queue }) => {
      setStationSlots(prev => {
        if (prev && String(prev.stationId) === String(stationId)) {
          return {
            ...prev,
            currentQueueCount: queueCount,
            estimatedWaitTimeMinutes: queueCount * 15,
          };
        }
        return prev;
      });
      fetchUserBookings();
    });

    socket.on('booking:updated', (updatedBooking) => {
      fetchUserBookings();
    });

    return () => socket.disconnect();
  }, [fetchUserBookings]);

  // Initial load of user bookings
  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  // ── Auto-fetch REAL ORIGINAL stations dynamically for any GPS location ─────────────────
  const fetchStations = useCallback(async (lat, lon, locationName = '') => {
    if (!lat || !lon) return;

    setStationsLoading(true);
    let realOriginal = [];

    // 1. Fetch real original stations from OpenChargeMap API
    try {
      realOriginal = await fetchRealStationsFromOCM(lat, lon, 40, 3500);
    } catch (e) {}

    // 2. Fetch real original stations from OpenStreetMap Overpass API if needed
    if (realOriginal.length === 0) {
      try {
        realOriginal = await fetchRealStationsFromOSM(lat, lon, 35, 3000);
      } catch (e) {}
    }

    // 3. Fetch real original stations from Backend API
    if (realOriginal.length === 0) {
      try {
        const res = await axios.get(`${API_BASE}/stations`, {
          params: { lat, lon, radius: 40, max: 15 },
          timeout: 3000,
        });
        if (res.data?.stations?.length > 0) {
          realOriginal = res.data.stations;
        }
      } catch (e) {}
    }

    setStationsLoading(false);

    // Show ONLY original real stations
    if (realOriginal.length > 0) {
      setStations(deduplicateStations(realOriginal));
    } else {
      // Fallback only if no original stations could be reached
      setStations(generateNearbyStations(lat, lon, 8, locationName));
    }
  }, []);

  const setSimulatorMode = useCallback((mode, params = {}) => {
    socketRef.current?.emit('simulator:setMode', { mode, params });
  }, []);

  // ── Booking & Queue API Action Methods ────────────────────────────────────────

  const fetchStationSlots = useCallback(async (stationId, date) => {
    setBookingError(null);
    try {
      const res = await axios.get(`${API_BASE}/charging-stations/${stationId}/slots`, {
        params: { date }
      });
      setStationSlots(res.data);
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      setBookingError(msg);
      throw new Error(msg);
    }
  }, []);

  const bookSlot = useCallback(async ({ stationId, stationName, startTime, date, chargerId, chargerType, powerKw, durationMinutes = 30 }) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await axios.post(`${API_BASE}/charging-stations/${stationId}/book`, {
        userId: 'demo',
        vehicleId: vehicleIdRef.current || 'demo_v1',
        stationName,
        startTime,
        date,
        chargerId: chargerId || 'charger-1',
        chargerType: chargerType || 'DC Fast Charger',
        powerKw: powerKw || 150,
        durationMinutes
      });
      await fetchUserBookings();
      await fetchStationSlots(stationId, date);
      setBookingLoading(false);
      return res.data;
    } catch (e) {
      setBookingLoading(false);
      const msg = e.response?.data?.detail || e.message || 'Booking failed';
      setBookingError(msg);
      throw new Error(msg);
    }
  }, [fetchUserBookings, fetchStationSlots]);

  const joinQueue = useCallback(async ({ stationId, stationName, chargerType, powerKw }) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await axios.post(`${API_BASE}/charging-stations/${stationId}/queue`, {
        userId: 'demo',
        vehicleId: vehicleIdRef.current || 'demo_v1',
        stationName,
        chargerType: chargerType || 'DC Fast Charger',
        powerKw: powerKw || 150
      });
      await fetchUserBookings();
      await fetchStationSlots(stationId);
      setBookingLoading(false);
      return res.data;
    } catch (e) {
      setBookingLoading(false);
      const msg = e.response?.data?.detail || e.message || 'Joining queue failed';
      setBookingError(msg);
      throw new Error(msg);
    }
  }, [fetchUserBookings, fetchStationSlots]);

  const cancelBooking = useCallback(async (bookingId, stationId) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await axios.post(`${API_BASE}/bookings/${bookingId}/cancel`);
      await fetchUserBookings();
      if (stationId) {
        await fetchStationSlots(stationId);
      }
      setBookingLoading(false);
      return res.data;
    } catch (e) {
      setBookingLoading(false);
      const msg = e.response?.data?.detail || e.message || 'Cancellation failed';
      setBookingError(msg);
      throw new Error(msg);
    }
  }, [fetchUserBookings, fetchStationSlots]);

  const startCharging = useCallback(async (bookingId) => {
    try {
      const res = await axios.post(`${API_BASE}/bookings/${bookingId}/start-charging`);
      await fetchUserBookings();
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      setBookingError(msg);
      throw new Error(msg);
    }
  }, [fetchUserBookings]);

  const completeCharging = useCallback(async (bookingId) => {
    try {
      const res = await axios.post(`${API_BASE}/bookings/${bookingId}/complete-charging`);
      await fetchUserBookings();
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      setBookingError(msg);
      throw new Error(msg);
    }
  }, [fetchUserBookings]);

  // Reads telemetry/vehicleId from refs (always current), origin/destination passed directly
  const runAnalysis = useCallback(async (origin, destination) => {
    const currentTelemetry = telemetryRef.current;
    const currentVehicleId = vehicleIdRef.current;

    liveLogRef.current = [];
    setIsAnalyzing(true);
    setAgentLog([]);
    setActiveAgents(['Supervisor']);

    try {
      const res = await axios.post(`${API_BASE}/analyze`, {
        telemetry: currentTelemetry,   // always latest, never stale
        origin: origin || { lat: 37.7749, lon: -122.4194 },
        destination: destination || null,
        vehicleId: currentVehicleId,
      }, { timeout: 90000 });

      setAnalysisResult(res.data);

      // Authoritative log from REST response (covers missed socket events)
      if (res.data?.agentLog?.length > 0) {
        setAgentLog(res.data.agentLog);
      }

      // Merge analysis stations with any auto-fetched ones (analysis data wins)
      const analysisStations = res.data?.agents?.charging?.all_candidates_full || [];
      if (analysisStations.length > 0) {
        setStations(analysisStations);
      }
    } catch (err) {
      console.error('[useEVSystem] Analysis failed:', err.message);
      const status = err.response?.status;
      const detail = err.response?.data?.error || err.message;
      setAgentLog([{
        agent: 'Supervisor',
        result: {
          error: `HTTP ${status || 'network'}: ${detail}`,
          reasoning: status === 500
            ? 'Backend error — check server console for details.'
            : 'Cannot reach backend. Make sure the server is running on port 5000.',
        },
        durationMs: 0,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsAnalyzing(false);
      setActiveAgents([]);
    }
  }, []);

  return {
    telemetry,
    vehicleId,
    agentLog,
    activeAgents,
    analysisResult,
    isAnalyzing,
    stations,
    stationsLoading,
    connected,
    userBookings,
    activeBooking,
    stationSlots,
    bookingLoading,
    bookingError,
    setSimulatorMode,
    runAnalysis,
    fetchStations,
    setStations,
    fetchStationSlots,
    bookSlot,
    joinQueue,
    cancelBooking,
    fetchUserBookings,
    startCharging,
    completeCharging,
  };
}


