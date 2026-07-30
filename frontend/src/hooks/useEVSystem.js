import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { generateNearbyStations, fetchRealStationsFromOSM } from '../utils/routeStationCalculator';

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

  const socketRef = useRef(null);
  const liveLogRef = useRef([]);

  // Always-current refs — avoids stale closure in runAnalysis
  const telemetryRef = useRef(null);
  const vehicleIdRef = useRef(null);

  // ── Socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
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

    return () => socket.disconnect();
  }, []);

  // ── Auto-fetch real stations dynamically for any GPS location ─────────────────
  const fetchStations = useCallback(async (lat, lon) => {
    if (!lat || !lon) return;
    setStationsLoading(true);
    let fetched = [];
    try {
      const res = await axios.get(`${API_BASE}/stations`, {
        params: { lat, lon, radius: 30, max: 15 },
        timeout: 10000,
      });
      if (res.data?.stations?.length > 0) {
        fetched = res.data.stations;
      }
    } catch (err) {
      console.warn('[useEVSystem] fetchStations backend call failed:', err.message);
    } finally {
      setStationsLoading(false);
    }

    if (fetched.length === 0) {
      fetched = await fetchRealStationsFromOSM(lat, lon, 30);
    }
    if (fetched.length === 0) {
      fetched = generateNearbyStations(lat, lon, 8);
    }
    setStations(fetched);
  }, []);



  const setSimulatorMode = useCallback((mode, params = {}) => {
    socketRef.current?.emit('simulator:setMode', { mode, params });
  }, []);

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
  }, []); // empty deps — safe because we use refs

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
    setSimulatorMode,
    runAnalysis,
    fetchStations,
    setStations,
  };
}

