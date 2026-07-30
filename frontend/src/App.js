import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import VehicleLogin from './components/VehicleLogin';
import WelcomeSplash from './components/WelcomeSplash';
import WelcomeBanner from './components/WelcomeBanner';
import EVVehicleLoader from './components/EVVehicleLoader';
import AgentSidePanel from './components/AgentSidePanel';
import Dashboard3D from './components/Dashboard3D';
import ChargingMap from './components/ChargingMap';
import EmergencyPanel from './components/EmergencyPanel';
import ReportsPanel from './components/ReportsPanel';
import V2VTransferPanel from './components/V2VTransferPanel';
import VehicleHealthAndEstimatorPanel from './components/VehicleHealthAndEstimatorPanel';
import TripRoadmapAndBatteryPanel from './components/TripRoadmapAndBatteryPanel';
import DriverSafetyAgentPanel from './components/DriverSafetyAgentPanel';
import { useEVSystem } from './hooks/useEVSystem';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { geocode, reverseGeocode } from './utils/geocoder';
import { generateRouteStations, generateNearbyStations, deduplicateStations } from './utils/routeStationCalculator';
import './index.css';




const TABS = ['Dashboard', 'Map', 'V2V Share', 'Reports'];
const VIEWS_3D = ['vehicle', 'battery'];

function getHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Animated telemetry value ───────────────────────────────────────────────────
function AnimatedValue({ value, unit = '', decimals = 1 }) {
  return (
    <motion.span
      key={Math.round((value || 0) * 10)}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {typeof value === 'number' ? value.toFixed(decimals) : value}{unit}
    </motion.span>
  );
}

// ── Telemetry Card (Rydex dark style) ─────────────────────────────────────────
function TelemetryCard({ label, value, unit, accentColor, icon, decimals = 1 }) {
  const colorStyle = accentColor && accentColor !== 'accent' ? accentColor : 'var(--accent)';
  return (
    <div className="rydex-card hover-lift" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        {icon}&nbsp; {label}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: colorStyle, letterSpacing: '-0.02em', lineHeight: 1 }}>
        <AnimatedValue value={value} unit={unit} decimals={decimals} />
      </div>
    </div>
  );
}

// ── Dark Card (replaces GlassCard) ────────────────────────────────────────────
function DarkCard({ children, className = '', style = {}, accent = false }) {
  return (
    <div className={accent ? 'rydex-card-accent' : 'rydex-card'} style={{ padding: '24px', ...style }}>
      {children}
    </div>
  );
}


// ── Section Label (Rydex pattern: — LABEL TEXT) ───────────────────────────────
function SectionLabel({ children }) {
  return <div className="section-label" style={{ marginBottom: 12 }}>{children}</div>;
}

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ onClick, disabled, children, fullWidth = false, style = {} }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="btn-primary"
      style={{
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      <span>{children}</span>
      <span className="btn-arrow">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </motion.button>
  );
}

// ── Location input with geocoding ─────────────────────────────────────────────
function LocationInput({ label, icon, value, onChange, onGeocode, loading, placeholder }) {
  const [input, setInput] = useState(value?.display_name || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (value?.display_name && value.display_name !== input) {
      setInput(value.display_name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.display_name]);

  async function handleSearch() {
    if (!input.trim()) return;
    setError('');
    try {
      const result = await geocode(input.trim());
      onChange(result);
      setInput(result.display_name);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="rydex-input"
          style={{ flex: 1 }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '10px 12px', flexShrink: 0 }}
        >
          {loading ? '…' : '↵'}
        </button>
        {onGeocode && (
          <button
            onClick={onGeocode}
            disabled={loading}
            className="btn-icon"
            title="Use current location"
          >
            📍
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--alert-red)', marginTop: 4 }}>{error}</div>}
      {value?.lat && !error && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
          {value.lat.toFixed(4)}, {value.lon.toFixed(4)}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const {
    telemetry, vehicleId, agentLog, activeAgents,
    analysisResult, isAnalyzing, stations, connected,
    setSimulatorMode, runAnalysis, fetchStations, setStations,
  } = useEVSystem();

  // ── Station filter state ──
  const [stationFilter, setStationFilter] = useState('all');

  // ── Authentication & Auth Step State ──
  const [userSession, setUserSession] = useState(() => {
    try {
      const saved = localStorage.getItem('ev_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authStep, setAuthStep] = useState(() => {
    try {
      return localStorage.getItem('ev_user_session') ? 'dashboard' : 'login';
    } catch {
      return 'login';
    }
  });
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  function handleLogin(sessionData) {
    setUserSession(sessionData);
    setAuthStep('welcome'); // Step 2: Show single window welcome screen
    setShowWelcomeBanner(true);
    try {
      localStorage.setItem('ev_user_session', JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  }

  function handleLogout() {
    setUserSession(null);
    setAuthStep('login');
    try {
      localStorage.removeItem('ev_user_session');
    } catch (e) {
      console.warn('Could not clear session:', e);
    }
  }

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [view3D, setView3D] = useState('vehicle');
  const [showEmergencyDismissed, setShowEmergencyDismissed] = useState(false);

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [destLoading, setDestLoading] = useState(false);

  // Auto-fetch nearby stations whenever origin location is available/updated
  useEffect(() => {
    if (origin?.lat && origin?.lon) {
      fetchStations(origin.lat, origin.lon);
    }
  }, [origin?.lat, origin?.lon, fetchStations]);

  // ── Driving Simulation State ──
  const [isDriving, setIsDriving] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [vehiclePos, setVehiclePos] = useState(null);
  const [heading, setHeading] = useState(0);
  const [simSpeedKmh, setSimSpeedKmh] = useState(0);
  const [simSoc, setSimSoc] = useState(80);
  const [simMultiplier, setSimMultiplier] = useState(1);
  const [simTraveledKm, setSimTraveledKm] = useState(0);
  const [totalRouteDistanceKm, setTotalRouteDistanceKm] = useState(0);

  // Synchronize origin with vehiclePos if not driving
  useEffect(() => {
    if (origin && !isDriving && currentRouteIndex === 0) {
      setVehiclePos({ lat: origin.lat, lon: origin.lon });
    }
  }, [origin, isDriving, currentRouteIndex]);

  // Synchronize simSoc with telemetry when idle to maintain continuous battery level
  useEffect(() => {
    if (!isDriving && telemetry?.soc != null) {
      setSimSoc(telemetry.soc);
    }
  }, [telemetry?.soc, isDriving]);

  // Callback when ChargingMap calculates OSRM route points
  const handleRouteLoaded = useCallback((data) => {
    if (data && data.points && data.points.length > 0) {
      setRoutePoints(data.points);
      setCurrentRouteIndex(0);
      setVehiclePos({ lat: data.points[0][0], lon: data.points[0][1] });

      // Calculate total route distance in km accurately
      let totalKm = 0;
      for (let i = 1; i < data.points.length; i++) {
        totalKm += getHaversineKm(data.points[i - 1][0], data.points[i - 1][1], data.points[i][0], data.points[i][1]);
      }
      setTotalRouteDistanceKm(+totalKm.toFixed(1));
      setSimTraveledKm(0);

      // Generate route stations along polyline and update stations state
      const { allStations } = generateRouteStations(
        data.points,
        { lat: data.points[0][0], lon: data.points[0][1] },
        { lat: data.points[data.points.length - 1][0], lon: data.points[data.points.length - 1][1] },
        stations
      );
      if (allStations && allStations.length > 0) {
        setStations(allStations);
      }
    } else {
      setRoutePoints([]);
      setTotalRouteDistanceKm(0);
      setSimTraveledKm(0);
    }
  }, [stations, setStations]);


  // Drive animation simulation loop
  useEffect(() => {
    if (!isDriving || routePoints.length < 2) {
      if (!isDriving && simSpeedKmh > 0) {
        setSimSpeedKmh(0);
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentRouteIndex((prevIndex) => {
        const step = 0.5 * simMultiplier;
        const nextIndex = prevIndex + step;

        if (nextIndex >= routePoints.length - 1) {
          setIsDriving(false);
          setSimSpeedKmh(0);
          const lastPt = routePoints[routePoints.length - 1];
          setVehiclePos({ lat: lastPt[0], lon: lastPt[1] });
          if (totalRouteDistanceKm > 0) setSimTraveledKm(totalRouteDistanceKm);
          return routePoints.length - 1;
        }

        const idx = Math.floor(nextIndex);
        const fraction = nextIndex - idx;
        const pt1 = routePoints[idx];
        const pt2 = routePoints[Math.min(idx + 1, routePoints.length - 1)];

        // Interpolate lat/lon
        const lat = pt1[0] + (pt2[0] - pt1[0]) * fraction;
        const lon = pt1[1] + (pt2[1] - pt1[1]) * fraction;
        setVehiclePos({ lat, lon });

        // Accurate segment distance step traveled in km
        const segDistKm = getHaversineKm(pt1[0], pt1[1], pt2[0], pt2[1]);
        const stepDistKm = (segDistKm * step) || 0.12;

        // Accumulate traveled distance km accurately
        setSimTraveledKm((prevKm) => +(prevKm + stepDistKm).toFixed(2));

        // Physics battery drain: ~0.18 kWh per km = ~0.225% SoC per km (80 kWh pack)
        const socDrop = stepDistKm * 0.225 * simMultiplier;
        setSimSoc((prevSoc) => Math.max(2, +(prevSoc - socDrop).toFixed(2)));

        // Calculate heading bearing angle in degrees
        const dLon = (pt2[1] - pt1[1]) * Math.PI / 180;
        const lat1 = pt1[0] * Math.PI / 180;
        const lat2 = pt2[0] * Math.PI / 180;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let brng = Math.atan2(y, x) * (180 / Math.PI);
        brng = (brng + 360) % 360;
        setHeading(brng);

        // Realistic dynamic speed fluctuation (around 82 km/h)
        const noise = Math.sin(Date.now() / 250) * 3.5 + (Math.random() * 2 - 1);
        setSimSpeedKmh(Math.max(45, Math.min(125, 82 + noise)));

        return nextIndex;
      });
    }, 150);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriving, routePoints, simMultiplier]);

  // Combined real-time telemetry
  const activeTelemetry = {
    ...(telemetry || {}),
    speedKmh: isDriving ? simSpeedKmh : (telemetry?.speedKmh || 0),
    mode: isDriving ? 'driving' : (telemetry?.mode || 'idle'),
    soc: isDriving ? simSoc : (telemetry?.soc || 80),
    estimatedRangeKm: isDriving ? Math.round((simSoc / 100) * 500) : (telemetry?.estimatedRangeKm || 400),
    totalDistanceKm: isDriving ? simTraveledKm : (telemetry?.totalDistanceKm || 0),
    traveledKm: isDriving ? simTraveledKm : 0,
    remainingKm: totalRouteDistanceKm > 0 ? Math.max(0, +(totalRouteDistanceKm - simTraveledKm).toFixed(1)) : 0,
    totalRouteKm: totalRouteDistanceKm,
  };

  // Active charging stations (prioritizes active route stations when navigating)
  const activeStations = useMemo(() => {
    let list = [];
    if (routePoints && routePoints.length > 1 && origin && destination) {
      const { allStations } = generateRouteStations(
        routePoints,
        { lat: origin.lat, lon: origin.lon },
        { lat: destination.lat, lon: destination.lon },
        stations
      );
      if (allStations && allStations.length > 0) list = allStations;
    }
    if (list.length === 0 && stations && stations.length > 0) {
      list = stations;
    }
    if (list.length === 0) {
      const targetLat = origin?.lat || 11.0168; // Sri Eshwar / Coimbatore default
      const targetLon = origin?.lon || 76.9558;
      list = generateNearbyStations(targetLat, targetLon, 8);
    }
    return deduplicateStations(list);
  }, [stations, routePoints, origin, destination]);




  // Auto-fetch real charging stations dynamically when origin or destination changes
  useEffect(() => {
    const target = destination || origin;
    if (target?.lat && target?.lon) {
      fetchStations(target.lat, target.lon);
    }
  }, [origin, destination, fetchStations]);


  // AI Voice Assistant Hook
  const voiceAssistant = useVoiceAssistant(activeTelemetry, routePoints, currentRouteIndex, isDriving);


  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const display_name = await reverseGeocode(lat, lon);
          setOrigin({ lat, lon, display_name });
        } catch {
          setOrigin({ lat, lon, display_name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
        }
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
        setOrigin({ lat: 37.7749, lon: -122.4194, display_name: 'San Francisco, CA (fallback)' });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  function handleGetGPS() {
    if (!navigator.geolocation) return;
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const display_name = await reverseGeocode(lat, lon);
          setOrigin({ lat, lon, display_name });
        } catch {
          setOrigin({ lat, lon, display_name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
        }
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { timeout: 10000 }
    );
  }

  async function handleDestGeocode(query) {
    setDestLoading(true);
    try {
      const result = await geocode(query);
      setDestination(result);
    } catch (e) {
      console.error(e.message);
    } finally {
      setDestLoading(false);
    }
  }

  const emergencyData = analysisResult?.agents?.emergency;
  const showEmergency = emergencyData?.is_emergency && !showEmergencyDismissed;

  const handleAnalyze = useCallback(() => {
    setShowEmergencyDismissed(false);
    setActiveTab('Map');
    runAnalysis(origin, destination);
  }, [runAnalysis, origin, destination]);

  const handleToggleDrive = useCallback(() => {
    if (isDriving) {
      setIsDriving(false);
      setSimulatorMode('idle');
    } else {
      if (!routePoints || routePoints.length < 2) {
        alert('Please select or search a destination in Route Planning before starting your drive!');
        return;
      }
      setIsDriving(true);
      setSimulatorMode('driving', { speedKmh: 80 });
    }
  }, [isDriving, routePoints, setSimulatorMode]);


  const activeAgentIds = activeAgents.map(name => ({
    'Battery Intelligence': 'battery',
    'Route Intelligence': 'route',
    'Charging Intelligence': 'charging',
    'Emergency Assistance': 'emergency',
    'Energy & Sustainability': 'energy',
    'Pricing & Cost': 'pricing',
    'Analytics & Reports': 'analytics',
    'Weather & Climate Intelligence': 'weather',
    'Driver Behavior & Safety': 'driver',
    'Grid Load & V2G Optimization': 'grid',
    'Predictive Fleet Maintenance': 'maintenance',
  }[name] || name));

  const canAnalyze = !isAnalyzing && origin;

  // Simulator modes config
  const simModes = [
    { mode: 'idle',     label: 'Park',           params: {},              icon: '🅿️' },
    { mode: 'driving',  label: 'Drive  80 km/h', params: { speedKmh: 80 },  icon: '🚗' },
    { mode: 'driving',  label: 'Drive 120 km/h', params: { speedKmh: 120 }, icon: '🏎️' },
    { mode: 'charging', label: 'Fast  150 kW',   params: { powerKw: 150 },  icon: '⚡' },
    { mode: 'charging', label: 'Slow  11 kW',    params: { powerKw: 11 },   icon: '🔌' },
  ];

  // Step 1: Login Screen
  if (!userSession || authStep === 'login') {
    return <VehicleLogin onLogin={handleLogin} />;
  }

  // Step 2: Dedicated Single Window Welcome Splash Screen
  if (authStep === 'welcome') {
    return (
      <WelcomeSplash
        vehicleName={userSession.vehicleName}
        onProceed={() => setAuthStep('dashboard')}
      />
    );
  }

  // Step 3: Main EV Operating System Dashboard Screen

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 990,
        background: 'rgba(8, 8, 5, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-muted)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
      }}>
        {/* Left side: Hamburger 3-lines menu + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="btn-secondary active"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 800, padding: '6px 14px',
              background: 'rgba(0, 240, 255, 0.15)',
              borderColor: 'rgba(0, 240, 255, 0.4)',
              color: '#00f0ff',
              cursor: 'pointer',
            }}
            title="Open AI Agents Left Side Panel (11 Agents)"
          >
            <span style={{ fontSize: 16 }}>☰</span> AI AGENTS (11)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--accent)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'var(--bg-base)',
            }}>⚡</div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                EV Multi-Agent OS
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
                INTELLIGENT AI PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="rydex-badge accent" style={{ fontSize: 11, fontWeight: 700 }}>
            🚗 {userSession.vehicleName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ fontSize: 11, padding: '5px 12px', borderColor: 'var(--border-strong)' }}
            title="Switch vehicle or logout"
          >
            Logout 🚪
          </button>
        </div>
      </header>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      {showWelcomeBanner && (
        <WelcomeBanner
          vehicleName={userSession.vehicleName}
          onDismiss={() => setShowWelcomeBanner(false)}
        />
      )}

      {/* ── Compact Executive Cockpit Header ───────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--border-muted)',
        padding: '16px 32px',
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        {/* Left side: Compact Title & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#00f0ff',
          }}>
            ⚡
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
              Smart EV Cockpit & Telemetry
            </h2>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 1 }}>
              Real-Time AI Multi-Agent Intelligence Platform
            </div>
          </div>
        </div>

        {/* Right side: Sleek Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.04)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-muted)' }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>BATTERY SOC</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#00f0ff' }}>{activeTelemetry ? Math.round(activeTelemetry.soc) : 80}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.04)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-muted)' }}>
            <span style={{ fontSize: 13 }}>🛣️</span>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>EST. RANGE</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{activeTelemetry ? Math.round(activeTelemetry.estimatedRangeKm) : 400} km</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.04)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-muted)' }}>
            <span style={{ fontSize: 13 }}>🔌</span>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>STATIONS</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#d4d414' }}>{activeStations.length} Hubs</div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <nav style={{
        padding: '0 32px',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex', gap: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const icon = tab === 'Dashboard' ? '📊' : tab === 'Map' ? '🗺️' : tab === 'V2V Share' ? '⚡' : '📈';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span> {tab}
            </button>
          );
        })}
      </nav>

      {/* ── Emergency Banner ───────────────────────────────────────────────── */}
      {showEmergency && (
        <EmergencyPanel emergencyData={emergencyData} onDismiss={() => setShowEmergencyDismissed(true)} />
      )}

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main style={{ padding: '32px 32px', maxWidth: '100%' }}>
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {activeTab === 'Dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32, alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>


                  {/* 3D Viewer */}
                  <DarkCard>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {VIEWS_3D.map(v => (
                        <button
                          key={v}
                          onClick={() => setView3D(v)}
                          className={`btn-secondary ${view3D === v ? 'active' : ''}`}
                          style={{ fontSize: 12 }}
                        >
                          {v === 'vehicle' ? '🚗 Vehicle' : '🔋 Battery'}
                        </button>
                      ))}
                    </div>
                    <div style={{ height: 440 }}>
                      <Dashboard3D telemetry={activeTelemetry} activeAgents={activeAgentIds} agentResults={analysisResult?.agents} view={view3D} vehicleName={userSession?.vehicleName} />
                    </div>
                  </DarkCard>

                  {/* Trip Driving Controls (Directly below vehicle display) */}
                  <DarkCard accent={isDriving}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <SectionLabel>🚗 Live Drive Controls</SectionLabel>
                      
                      <button
                        onClick={voiceAssistant.toggleVoice}
                        className="btn-secondary"
                        style={{
                          fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 20,
                          background: voiceAssistant.isVoiceOn ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: voiceAssistant.isVoiceOn ? '#00f0ff' : 'var(--text-muted)',
                          border: `1px solid ${voiceAssistant.isVoiceOn ? '#00f0ff' : 'var(--border-muted)'}`,
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        }}
                      >
                        {voiceAssistant.isVoiceOn ? '🔊 VOICE ASSISTANT ON' : '🔇 VOICE ASSISTANT OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            if (isDriving) {
                              setIsDriving(false);
                              setSimulatorMode('idle');
                            } else {
                              if (routePoints.length < 2) {
                                alert('Please enter a destination to calculate your route before starting your drive!');
                                return;
                              }
                              setIsDriving(true);
                              setSimulatorMode('driving', { speedKmh: 80 });
                            }
                          }}
                          className={`btn-primary ${isDriving ? 'active' : ''}`}
                          style={{
                            background: isDriving ? '#ff5050' : '#00f0ff',
                            color: '#080805',
                            borderColor: isDriving ? '#ff5050' : '#00f0ff',
                            fontWeight: 800,
                          }}
                        >
                          {isDriving ? '⏸️ PARK VEHICLE' : '🚗 START YOUR DRIVE'}
                        </button>

                        <button
                          onClick={() => {
                            setIsDriving(false);
                            setCurrentRouteIndex(0);
                            setSimSoc(telemetry?.soc || 80);
                            setSimTraveledKm(0);
                            if (routePoints.length > 0) {
                              setVehiclePos({ lat: routePoints[0][0], lon: routePoints[0][1] });
                            }
                            setSimulatorMode('idle');
                          }}
                          className="btn-secondary"
                        >
                          🔄 Reset
                        </button>
                      </div>

                      {/* Speed multiplier selector */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SIM SPEED:</span>
                        {[1, 3, 10].map(mult => (
                          <button
                            key={mult}
                            onClick={() => setSimMultiplier(mult)}
                            className={`btn-secondary ${simMultiplier === mult ? 'active' : ''}`}
                            style={{ padding: '4px 10px', fontSize: 11 }}
                          >
                            {mult}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Voice Announcement Readout Banner */}
                    {voiceAssistant.isVoiceOn && voiceAssistant.lastSpokenMessage && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)',
                        fontSize: 11, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontSize: 14 }}>🗣️</span>
                        <span style={{ fontWeight: 600 }}>AI Voice Announcement: "{voiceAssistant.lastSpokenMessage}"</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {routePoints.length > 1 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: 'var(--text-secondary)' }}>
                          <span>Route Progress</span>
                          <span style={{ color: '#00f0ff', fontWeight: 700 }}>
                            {Math.round((currentRouteIndex / (routePoints.length - 1)) * 100)}% Completed
                          </span>
                        </div>
                        <div className="rydex-progress" style={{ height: 6 }}>
                          <div
                            className="rydex-progress-bar"
                            style={{
                              width: `${(currentRouteIndex / (routePoints.length - 1)) * 100}%`,
                              background: 'linear-gradient(90deg, #00f0ff, #d4d414)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </DarkCard>

                  {/* Telemetry row (Directly below START YOUR DRIVE) */}
                  {activeTelemetry && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                      <TelemetryCard label="State of Charge" value={activeTelemetry.soc} unit="%" accentColor={activeTelemetry.soc <= 15 ? '#ff5050' : 'var(--accent)'} icon="⚡" />
                      <TelemetryCard label="Est. Range" value={activeTelemetry.estimatedRangeKm} unit=" km" accentColor="var(--text-primary)" icon="🛣️" decimals={0} />
                      <TelemetryCard label="Distance Driven" value={activeTelemetry.traveledKm || activeTelemetry.totalDistanceKm || 0} unit=" km" accentColor="#00f0ff" icon="🚗" decimals={1} />
                      <TelemetryCard label="Remaining Trip" value={activeTelemetry.remainingKm || 0} unit=" km" accentColor="#d4d414" icon="🏁" decimals={1} />
                      <TelemetryCard label="Temperature" value={activeTelemetry.temperatureC || 25} unit="°C" accentColor={(activeTelemetry.temperatureC || 25) > 40 ? 'var(--alert-red)' : 'var(--warning)'} icon="🌡️" />
                    </div>
                  )}

                  {/* AI Recommended Best Route & Complete Waypoint Roadmap */}
                  {destination && (
                    <TripRoadmapAndBatteryPanel
                      telemetry={activeTelemetry}
                      routeKm={totalRouteDistanceKm}
                      origin={origin}
                      destination={destination}
                      stations={stations}
                    />
                  )}

                  {/* Driver Behavior & Safety AI Agent Dedicated Panel */}
                  <DriverSafetyAgentPanel
                    telemetry={activeTelemetry}
                    isDriving={isDriving}
                    driverAgentData={analysisResult?.agents?.driver}
                  />

                  {/* Vehicle Check & Service-on-KM Monitor Panel */}
                  <VehicleHealthAndEstimatorPanel
                    telemetry={activeTelemetry}
                    vehicleName={userSession?.vehicleName || 'TATA Safari EV'}
                  />

                  {/* Simulator Controls */}
                  <DarkCard>
                    <SectionLabel>Backend Simulator Controls</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {simModes.map(({ mode, label, params, icon }) => (
                        <button
                          key={label}
                          onClick={() => {
                            if (mode === 'driving') {
                              setIsDriving(true);
                            } else {
                              setIsDriving(false);
                            }
                            setSimulatorMode(mode, params);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: 12 }}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                    {activeTelemetry && (
                      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>Mode: <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{activeTelemetry.mode}</span></span>
                        {activeTelemetry.speedKmh > 0 && <span>Speed: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{Math.round(activeTelemetry.speedKmh)} km/h</span></span>}
                        {activeTelemetry.chargingPowerKw > 0 && <span>Power: <span style={{ color: 'var(--text-secondary)' }}>{activeTelemetry.chargingPowerKw} kW</span></span>}
                        <span>Heading: <span style={{ color: '#00f0ff', fontWeight: 600 }}>{Math.round(heading)}°</span></span>
                      </div>
                    )}
                  </DarkCard>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>


                  {/* Route Planning */}
                  <DarkCard>
                    <SectionLabel>Route Planning</SectionLabel>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Origin */}
                      <LocationInput
                        label="Your Location"
                        icon="📍"
                        value={origin}
                        onChange={setOrigin}
                        onGeocode={handleGetGPS}
                        loading={locationStatus === 'loading'}
                        placeholder="Search address or use GPS…"
                      />
                      {locationStatus === 'loading' && (
                        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>
                          <EVVehicleLoader label="Acquiring GPS Location…" compact={true} />
                        </div>
                      )}
                      {locationStatus === 'denied' && (
                        <div style={{ fontSize: 11, color: 'var(--warning)' }}>GPS denied — type your location or defaults to San Francisco</div>
                      )}
                      {locationStatus === 'granted' && origin && (
                        <div style={{ fontSize: 11, color: 'var(--success)' }}>✓ GPS acquired</div>
                      )}

                      <hr className="rydex-divider" />

                      {/* Destination */}
                      <LocationInput
                        label="Destination"
                        icon="🏁"
                        value={destination}
                        onChange={setDestination}
                        loading={destLoading}
                        placeholder="e.g. Times Square, New York…"
                      />
                      {!destination && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Optional — agents run without a destination</div>
                      )}

                      {/* Route summary */}
                      {origin && destination && (
                        <div style={{ padding: '10px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: 11 }}>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: 3 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>From: </span>
                            {origin.display_name?.split(',').slice(0, 2).join(',')}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>To: </span>
                            {destination.display_name?.split(',').slice(0, 2).join(',')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Analyze button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={!canAnalyze}
                      style={{
                        width: '100%',
                        marginTop: 16,
                        padding: '14px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: canAnalyze ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${canAnalyze ? 'var(--accent-border)' : 'var(--border-muted)'}`,
                        borderRadius: 8,
                        color: canAnalyze ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600, fontSize: 13,
                        cursor: canAnalyze ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>
                        {isAnalyzing ? (
                          <EVVehicleLoader label="Navigating & Calculating OSRM Route…" compact={true} />
                        ) : !origin ? '📍 Locating Vehicle Position…' : '🧠 Proceed & Load Map'}
                      </span>
                      <span style={{
                        width: 28, height: 28, background: canAnalyze ? 'var(--accent)' : 'var(--border-muted)',
                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--bg-base)', fontSize: 13, fontWeight: 800,
                        transition: 'background 0.2s',
                      }}>🗺️</span>
                    </motion.button>
                  </DarkCard>

                  {/* Synthesis Result */}
                  {analysisResult?.synthesis && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <DarkCard accent>
                        <SectionLabel>Supervisor Synthesis</SectionLabel>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                          {analysisResult.synthesis.priority_action}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                          {analysisResult.synthesis.summary}
                        </div>
                        {analysisResult.synthesis.key_insights?.map((insight, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>›</span>
                            {insight}
                          </div>
                        ))}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`rydex-badge ${
                            analysisResult.synthesis.overall_status === 'critical' ? 'danger' :
                            analysisResult.synthesis.overall_status === 'attention_needed' ? 'warning' : 'success'
                          }`}>
                            {analysisResult.synthesis.overall_status?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{analysisResult.totalDurationMs}ms</span>
                        </div>
                      </DarkCard>
                    </motion.div>
                  )}

                  {/* Next Steps */}
                  {analysisResult?.synthesis?.next_steps?.length > 0 && (
                    <DarkCard>
                      <SectionLabel>Next Steps</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analysisResult.synthesis.next_steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-heading)', flexShrink: 0, fontSize: 14 }}>{step.step}.</span>
                            <div>
                              <span style={{ color: 'var(--text-primary)' }}>{step.action}</span>
                              <span className={`rydex-badge ${
                                step.urgency === 'critical' ? 'danger' :
                                step.urgency === 'high' ? 'warning' :
                                step.urgency === 'medium' ? 'warning' : ''
                              }`} style={{ marginLeft: 6 }}>{step.urgency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DarkCard>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MAP ── */}
          {activeTab === 'Map' && (
            <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <DarkCard style={{ marginBottom: 32, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                  <div>
                    <SectionLabel>Charging Infrastructure</SectionLabel>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                      Station Map
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* START YOUR DRIVE Action Button */}
                    <button
                      onClick={handleToggleDrive}
                      className="btn-primary"
                      style={{
                        background: isDriving ? '#ff5050' : '#00f0ff',
                        color: '#080805',
                        borderColor: isDriving ? '#ff5050' : '#00f0ff',
                        fontWeight: 900, fontSize: 12, padding: '7px 18px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        boxShadow: isDriving ? '0 0 15px rgba(255,80,80,0.3)' : '0 0 15px rgba(0,240,255,0.3)',
                      }}
                    >
                      {isDriving ? '⏸️ PARK VEHICLE' : '🚗 START YOUR DRIVE'}
                    </button>

                    {/* Sim Speed Multiplier Selector */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-muted)' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>SPEED:</span>
                      {[1, 3, 10].map(mult => (
                        <button
                          key={mult}
                          onClick={() => setSimMultiplier(mult)}
                          className={`btn-secondary ${simMultiplier === mult ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: 10 }}
                        >
                          {mult}x
                        </button>
                      ))}
                    </div>

                    <span className="rydex-badge accent">{activeStations.length} stations</span>
                    {isDriving && <span className="rydex-badge success">🚗 Live Drive Active</span>}
                  </div>
                </div>
                <div style={{ minHeight: 520, borderRadius: 12, overflow: 'hidden' }}>
                  <ChargingMap
                    vehicleLat={vehiclePos?.lat ?? origin?.lat ?? 37.7749}
                    vehicleLon={vehiclePos?.lon ?? origin?.lon ?? -122.4194}
                    destLat={destination?.lat}
                    destLon={destination?.lon}
                    stations={activeStations}
                    emergencyRadius={emergencyData?.is_emergency ? 10 : null}
                    heading={heading}
                    isDriving={isDriving}
                    onToggleDrive={handleToggleDrive}
                    soc={activeTelemetry?.soc ?? 80}
                    onRouteLoaded={handleRouteLoaded}
                  />
                </div>
              </DarkCard>
              {/* ── Nearby & On-Route Charging Stations Section ── */}
              <div style={{ marginTop: 32 }}>
                <DarkCard style={{ padding: 24 }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                    <div>
                      <SectionLabel>⚡ NEARBY & ON-ROUTE CHARGING HUBS</SectionLabel>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
                        {origin?.display_name ? `Charging Hubs Near ${origin.display_name.split(',')[0]}` : 'Nearby EV Charging Stations'}
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Real-time availability, charging speed & rest amenities
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { key: 'all', label: 'All Hubs' },
                        { key: 'fast', label: '⚡ 100kW+ Fast' },
                        { key: 'available', label: '🟢 Available Now' },
                        { key: 'green', label: '🌱 Green Energy' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setStationFilter(key)}
                          className={`btn-secondary ${stationFilter === key ? 'active' : ''}`}
                          style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20 }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stations Grid */}
                  {(() => {
                    const displayStations = activeStations;


                    const filtered = displayStations.filter(s => {
                      if (stationFilter === 'fast') return s.max_power_kw >= 100;
                      if (stationFilter === 'available') return s.available_bays > 0;
                      if (stationFilter === 'green') return s.is_green;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No charging stations match the selected filter.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filtered.map(s => (
                          <DarkCard key={s.id || s.name} className="hover-lift" style={{ padding: 18, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: '#fff' }}>
                                  {s.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  📍 {s.address || `Km ${s.distanceFromOriginKm || Math.round(s.distance_km || 0)}`}
                                </div>
                              </div>
                              <span className={`rydex-badge ${s.available_bays > 0 ? 'success' : 'danger'}`} style={{ fontSize: 10, fontWeight: 800 }}>
                                {s.available_bays}/{s.total_bays} Bays Free
                              </span>
                            </div>

                            {/* Specs Badge Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, margin: '12px 0', fontSize: 12 }}>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>POWER OUTPUT</span>
                                <span style={{ fontWeight: 800, color: '#00f0ff' }}>⚡ {s.max_power_kw} kW Fast</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>TARIFF</span>
                                <span style={{ fontWeight: 800, color: '#fff' }}>💰 ₹{s.price_per_kwh}/kWh</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>DISTANCE</span>
                                <span style={{ fontWeight: 800, color: '#d4d414' }}>
                                  {s.distance_km ? `${s.distance_km} km` : s.distanceFromOriginKm ? `Km ${s.distanceFromOriginKm}` : 'Nearby'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>ENERGY TYPE</span>
                                <span style={{ fontWeight: 700, color: s.is_green ? '#22c55e' : '#60a5fa' }}>
                                  {s.is_green ? '🌱 Green Solar' : '⚡ Grid Power'}
                                </span>
                              </div>
                            </div>

                            {/* Amenities */}
                            {s.amenities && s.amenities.length > 0 && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                {s.amenities.map((am, i) => (
                                  <span key={i} style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                                    {am}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Button */}
                            <button
                              onClick={() => setDestination({ lat: s.lat, lon: s.lon, display_name: s.name })}
                              className="btn-primary"
                              style={{ width: '100%', padding: '8px 12px', fontSize: 12, justifyContent: 'center' }}
                            >
                              📍 Route & Navigate to Station
                            </button>
                          </DarkCard>
                        ))}
                      </div>
                    );
                  })()}
                </DarkCard>
              </div>
            </motion.div>

          )}

          {/* ── V2V CHARGE TRANSFER ── */}
          {activeTab === 'V2V Share' && (
            <motion.div key="v2v" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <V2VTransferPanel telemetry={activeTelemetry} vehicleName={userSession?.vehicleName || 'TATA Safari EV'} />
            </motion.div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'Reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <ReportsPanel
                  telemetry={activeTelemetry}
                  vehicleName={userSession?.vehicleName || 'TATA Safari EV'}
                  agentResults={analysisResult?.agents}
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── AI Agents Side Panel Drawer (Toggled by ☰) ── */}
      <AgentSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        agentResults={analysisResult?.agents}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={handleAnalyze}
      />
    </div>
  );
}
