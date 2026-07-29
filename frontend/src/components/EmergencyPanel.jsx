import { motion, AnimatePresence } from 'framer-motion';

/**
 * Emergency panel — Rydex-styled alert shown when SOC < 15%.
 * Uses #FF5050 (Rydex alert red) as the primary accent.
 */
export default function EmergencyPanel({ emergencyData, onDismiss }) {
  if (!emergencyData?.is_emergency) return null;

  const isCritical = emergencyData.urgency_level === 'critical';
  const isHigh = emergencyData.urgency_level === 'high';
  const accentColor = isCritical ? '#ff5050' : isHigh ? '#f59e0b' : '#fcd34d';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        style={{
          margin: '0 32px 20px',
          borderRadius: 12,
          background: `${accentColor}0e`,
          border: `1px solid ${accentColor}55`,
          overflow: 'hidden',
        }}
      >
        {/* Alert top bar */}
        <div style={{ height: 3, background: accentColor, width: '100%' }} />

        <div style={{ padding: '16px 20px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                style={{ fontSize: 22 }}
              >
                🚨
              </motion.div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15,
                  color: accentColor, letterSpacing: '-0.01em',
                }}>
                  EMERGENCY — {emergencyData.urgency_level?.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                  Battery critically low — immediate action required
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                borderRadius: 6, width: 28, height: 28,
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ✕
            </button>
          </div>

          {/* Priority action */}
          <div style={{
            padding: '12px 14px', borderRadius: 8,
            background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
            marginBottom: 14,
          }}>
            <div className="section-label" style={{ marginBottom: 6, fontSize: 10 }}>Recommended Action</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {emergencyData.recommended_action}
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Nearest station */}
            {emergencyData.nearest_charging_station && (
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'rgba(212, 212, 20, 0.06)', border: '1px solid rgba(212, 212, 20, 0.25)',
              }}>
                <div className="section-label" style={{ marginBottom: 6, fontSize: 10 }}>Nearest Charger</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>
                  {emergencyData.nearest_charging_station.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {emergencyData.nearest_charging_station.distance_km} km away · {emergencyData.nearest_charging_station.power_kw} kW
                </div>
              </div>
            )}

            {/* V2V candidate */}
            {emergencyData.v2v_candidate_vehicle && (
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 20, height: 20, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🔋</div>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e' }}>V2V Energy Share</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>
                  {emergencyData.v2v_candidate_vehicle.vehicle}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {emergencyData.v2v_candidate_vehicle.distance_km} km away · {emergencyData.v2v_candidate_vehicle.shareable_kwh} kWh
                </div>
              </div>
            )}
          </div>

          {/* Immediate steps */}
          {emergencyData.immediate_steps?.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 8, fontSize: 10 }}>Immediate Steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {emergencyData.immediate_steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                    <span style={{
                      minWidth: 20, height: 20, borderRadius: 4,
                      background: `${accentColor}18`, border: `1px solid ${accentColor}44`,
                      color: accentColor, fontWeight: 700, fontSize: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* V2V candidates list */}
          {emergencyData.v2v_candidates?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="section-label" style={{ marginBottom: 8, fontSize: 10 }}>
                Nearby V2V Vehicles ({emergencyData.v2v_candidates.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {emergencyData.v2v_candidates.map(v => (
                  <div key={v.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 6,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
                    fontSize: 11,
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{v.vehicle} — {v.owner}</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{v.shareable_kwh} kWh · {v.distance_km} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
