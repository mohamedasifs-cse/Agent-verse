import { motion } from 'framer-motion';

/**
 * TripRoadmapAndBatteryPanel
 * 1. Dynamic Battery Needed (% SoC BIG, kWh small) & Live Arrival SoC.
 * 2. Step-by-step AI Trip Roadmap with Live Driving Updates.
 */
export default function TripRoadmapAndBatteryPanel({ telemetry, routeKm = 0, origin, destination, stations = [] }) {
  if (!destination) return null;

  const isDriving = (telemetry?.speedKmh || 0) > 0 || telemetry?.isDriving;
  const currentSoc = telemetry?.soc != null ? +telemetry.soc.toFixed(1) : 80;
  
  // Live dynamic remaining distance
  const initialDistKm = routeKm > 0 ? routeKm : 165.8;
  const liveRemainingKm = telemetry?.remainingKm > 0 ? +telemetry.remainingKm.toFixed(1) : initialDistKm;
  const distanceDrivenKm = telemetry?.traveledKm != null ? +telemetry.traveledKm.toFixed(1) : Math.max(0, +(initialDistKm - liveRemainingKm).toFixed(1));

  const evEfficiencyKwhPer100 = 16; // 16 kWh/100km

  // Dynamic Battery Power Needed Calculations
  const liveEnergyNeededKwh = +((liveRemainingKm * evEfficiencyKwhPer100) / 100).toFixed(1);
  const liveSocRequiredPct = Math.round((liveEnergyNeededKwh / 80) * 100); // 80 kWh pack capacity
  const arrivalSocPct = Math.max(0, +(currentSoc - liveSocRequiredPct).toFixed(1));
  const isChargingNeeded = arrivalSocPct < 15;

  // Dynamic estimated driving time
  const drivingHours = Math.floor(liveRemainingKm / 80);
  const drivingMins = Math.round(((liveRemainingKm / 80) % 1) * 60);

  // Best intermediate charging station recommendation
  const bestPitStop = stations.length > 0
    ? stations[Math.floor(stations.length / 2)]
    : { name: 'Tata Power Fast DC Hub', max_power_kw: 150, price_per_kwh: 18, distance_km: Math.round(initialDistKm * 0.5) };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rydex-card"
      style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--text-primary)', border: '1px solid rgba(0, 240, 255, 0.35)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#00f0ff',
          }}>
            ⚡🗺️
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Battery Power & Complete Trip Roadmap</span>
              {isDriving && (
                <span style={{ fontSize: 10, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.18)', padding: '2px 8px', borderRadius: 10, animation: 'pulse 1.5s infinite' }}>
                  🔴 DYNAMIC LIVE DRIVE
                </span>
              )}
            </h3>
            <div style={{ fontSize: 11, color: '#00f0ff', fontWeight: 700, letterSpacing: '0.04em' }}>
              REAL-TIME AI ROUTE ENERGY & WAYPOINT NAVIGATION
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 800,
          color: isChargingNeeded ? '#ff5050' : 'var(--success)',
          background: isChargingNeeded ? 'rgba(255, 80, 80, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${isChargingNeeded ? '#ff5050' : 'var(--success)'}`,
          padding: '4px 12px', borderRadius: 14,
        }}>
          {isChargingNeeded ? '⚠️ PIT-STOP CHARGE REQUIRED' : '✓ TRIP FEASIBLE WITHOUT STOP'}
        </span>
      </div>

      {/* ── SECTION 1: BATTERY POWER NEEDED FOR TRIP (% BIG, kWh SMALL) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        
        {/* CARD 1: BATTERY POWER NEEDED (% BIG, kWh SMALL) */}
        <div style={{ background: 'rgba(0, 240, 255, 0.06)', padding: 14, borderRadius: 10, border: '1px solid rgba(0, 240, 255, 0.35)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            BATTERY POWER NEEDED
          </div>
          {/* PERCENTAGE IS BIG */}
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#00f0ff', lineHeight: 1.1 }}>
            {liveSocRequiredPct}% <span style={{ fontSize: 16, fontWeight: 700 }}>SoC</span>
          </div>
          {/* kWh IS SMALL BELOW */}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
            ⚡ {liveEnergyNeededKwh} kWh energy required
          </div>
        </div>

        {/* CARD 2: PREDICTED ARRIVAL SOC */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 14, borderRadius: 10, border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            PREDICTED ARRIVAL SOC
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: arrivalSocPct < 15 ? '#ff5050' : 'var(--success)', lineHeight: 1.1 }}>
            {arrivalSocPct}% <span style={{ fontSize: 16, fontWeight: 700 }}>SoC</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
            Current Battery SoC: {currentSoc}%
          </div>
        </div>

        {/* CARD 3: REMAINING ROADMAP DISTANCE */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 14, borderRadius: 10, border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            REMAINING DISTANCE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            {liveRemainingKm} <span style={{ fontSize: 16, fontWeight: 700 }}>km</span>
          </div>
          <div style={{ fontSize: 11, color: isDriving ? '#00f0ff' : 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
            {isDriving ? `🏎️ Driven ${distanceDrivenKm} km` : `Est. Time: ${drivingHours}h ${drivingMins}m`}
          </div>
        </div>

      </div>

      {/* ── SECTION 2: COMPLETE DYNAMIC WAYPOINT ROADMAP ── */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🚩 Complete AI Waypoint Roadmap
          </span>
          {isDriving && (
            <span style={{ fontSize: 10, color: '#00f0ff', fontWeight: 700 }}>
              Live Speed: {Math.round(telemetry?.speedKmh || 80)} km/h
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 12 }}>
          {/* Vertical connecting line */}
          <div style={{
            position: 'absolute', left: 24, top: 20, bottom: 20, width: 2,
            background: 'linear-gradient(180deg, #00f0ff, #d4d414 50%, #22c55e)',
            zIndex: 1,
          }} />

          {/* Waypoint 1: Origin Departure */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: distanceDrivenKm > 0 ? 'var(--success)' : '#00f0ff', color: '#080805',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900,
              boxShadow: '0 0 12px #00f0ff', flexShrink: 0,
            }}>
              {distanceDrivenKm > 0 ? '✓' : '1'}
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-muted)', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                🚀 DEPARTURE COCKPIT: {origin?.display_name?.split(',')[0] || 'Current Location'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Initial Battery SoC: <strong style={{ color: '#00f0ff' }}>{currentSoc}%</strong> · Driven: <strong>{distanceDrivenKm} km</strong>
              </div>
            </div>
          </div>

          {/* Waypoint 2: Recommended Pit-Stop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: '#d4d414', color: '#080805',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900,
              boxShadow: '0 0 12px #d4d414', flexShrink: 0,
            }}>
              2
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(212, 212, 20, 0.35)', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#d4d414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>⚡ RECOMMENDED REST & CHARGING STOP</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>~{bestPitStop.distance_km || Math.round(initialDistKm * 0.5)} km mark</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Hub: <strong>{bestPitStop.name}</strong> · Power: <strong style={{ color: '#00f0ff' }}>{bestPitStop.max_power_kw || 150} kW DC Fast</strong>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                💡 Recommended: Charge for 18 minutes to boost SoC back to 80%.
              </div>
            </div>
          </div>

          {/* Waypoint 3: Destination Arrival */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: '#22c55e', color: '#080805',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900,
              boxShadow: '0 0 12px #22c55e', flexShrink: 0,
            }}>
              3
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.35)', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>
                🏁 DESTINATION ARRIVAL: {destination.display_name?.split(',')[0] || destination.display_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Predicted Reserve SoC: <strong style={{ color: arrivalSocPct < 15 ? '#ff5050' : 'var(--success)' }}>{arrivalSocPct}%</strong> · Remaining: <strong>{liveRemainingKm} km</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
