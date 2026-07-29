import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_AGENTS_VEHICLE_META = [
  {
    key: 'battery', title: 'Battery Intelligence', category: 'Powertrain', icon: '🔋', color: '#22c55e', role: '800V Pack & Cell SOH',
    descLine1: 'Monitors 800V high-voltage battery State of Charge (SoC), State of Health (SoH), and cell balance.',
    descLine2: 'Predicts real-time discharge curves and optimizes thermal management for maximum pack lifespan.',
  },
  {
    key: 'route', title: 'Route Intelligence', category: 'Navigation', icon: '🗺️', color: '#00f0ff', role: 'OSRM GPS & Range Arc',
    descLine1: 'Calculates optimal GPS highway routes using live OSRM polyline sampling and elevation profiles.',
    descLine2: 'Dynamically projects your EV driving range arc and calculates precise arrival ETA based on traffic.',
  },
  {
    key: 'charging', title: 'Charging Intelligence', category: 'Powertrain', icon: '⚡', color: '#d4d414', role: 'DC Fast Charge Hubs',
    descLine1: 'Finds ultra-fast DC charging hubs along your route filtered by power (150kW+), pricing, and bay availability.',
    descLine2: 'Calculates battery range threshold pit-stops to recommend the optimal rest & charge stop.',
  },
  {
    key: 'emergency', title: 'Emergency Assistance', category: 'Safety', icon: '🚨', color: '#ff5050', role: 'Airbag, Braking & SRS',
    descLine1: 'Detects critical low battery (≤ 10%), thermal anomalies, airbag deployment, or system failures.',
    descLine2: 'Automatically triggers emergency roadside assistance and critical safety dispatch protocols.',
  },
  {
    key: 'v2v', title: 'Vehicle-to-Vehicle (V2V) Charge', category: 'Powertrain', icon: '⚡🔋', color: '#00f0ff', role: 'Emergency V2V Energy Share',
    descLine1: 'Enables emergency battery energy sharing between nearby opted-in EVs during low-charge situations.',
    descLine2: 'Uses AI matching to select nearby helper vehicles based on highest SoC, distance, and reward payout.',
  },
  {
    key: 'energy', title: 'Energy & Sustainability', category: 'Powertrain', icon: '🌱', color: '#22c55e', role: 'Carbon & Regen Recovery',
    descLine1: 'Tracks carbon footprint savings (kg CO₂) and kinetic energy recovery via regenerative braking.',
    descLine2: 'Evaluates eco-driving efficiency to maximize kilometers generated per kWh of energy consumed.',
  },
  {
    key: 'pricing', title: 'Pricing & Cost', category: 'Economics', icon: '💰', color: '#f59e0b', role: 'Tariffs & Session Cost',
    descLine1: 'Compares real-time station charging tariffs (₹/kWh) and off-peak utility grid pricing.',
    descLine2: 'Estimates total trip charging costs and calculates net financial savings compared to petrol.',
  },
  {
    key: 'analytics', title: 'Analytics & Reports', category: 'Diagnostics', icon: '📊', color: '#60a5fa', role: 'Telemetry Trends',
    descLine1: 'Aggregates telemetry metrics, charge session histories, and battery degradation trends over time.',
    descLine2: 'Generates comprehensive fleet performance reports and predictive health diagnostics.',
  },
  {
    key: 'weather', title: 'Weather & Climate', category: 'Environment', icon: '🌤️', color: '#38bdf8', role: 'HVAC & Cabin Thermal',
    descLine1: 'Analyzes ambient temperature, headwind speed, and climate conditions along your driving route.',
    descLine2: 'Predicts cabin HVAC thermal power draw and calculates exact weather-induced range impact.',
  },
  {
    key: 'driver', title: 'Driver Behavior & Safety', category: 'Safety', icon: '🏎️', color: '#a855f7', role: 'Throttle & Safety Rating',
    descLine1: 'Evaluates driving smoothness, acceleration aggressiveness, and regen braking habits (Eco-Score 0-100).',
    descLine2: 'Provides real-time coaching tips to increase driving safety and extend overall battery range.',
  },
  {
    key: 'grid', title: 'Grid Load & V2G', category: 'Powertrain', icon: '🔌', color: '#ec4899', role: 'Renewable V2G Feed',
    descLine1: 'Monitors power grid carbon intensity and peak/off-peak renewable energy availability.',
    descLine2: 'Manages Vehicle-to-Grid (V2G) energy export back to the grid during high-demand tariff hours.',
  },
  {
    key: 'maintenance', title: 'Predictive Maintenance', category: 'Hardware', icon: '🔧', color: '#f97316', role: 'Brakes, Tires & Inverter',
    descLine1: 'Inspects tire tread wear %, brake pad thickness, inverter thermals, and motor vibration.',
    descLine2: 'Forecasts component degradation to schedule preventive servicing before hardware failure.',
  },
];

export default function AgentSidePanel({ isOpen, onClose, agentResults, isAnalyzing, onRunAnalysis }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredAgents = ALL_AGENTS_VEHICLE_META.filter(agent => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Powertrain') return ['battery', 'charging', 'v2v', 'energy', 'grid'].includes(agent.key);
    if (activeFilter === 'Safety') return ['emergency', 'driver'].includes(agent.key);
    if (activeFilter === 'Hardware') return ['maintenance', 'weather'].includes(agent.key);
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
              background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Slide-out Left Side Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 999,
              width: '100%', maxWidth: 440,
              background: 'rgba(10, 14, 26, 0.97)',
              borderRight: '1px solid rgba(0, 240, 255, 0.35)',
              boxShadow: '10px 0 40px rgba(0,0,0,0.8), 0 0 30px rgba(0,240,255,0.15)',
              backdropFilter: 'blur(20px)',
              display: 'flex', flexDirection: 'column',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header with 3 lines hamburger icon */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.85)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* 3 lines icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#00f0ff', fontWeight: 900,
                }}>
                  ☰
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 900, margin: 0, color: '#fff' }}>
                    AI Agents Control Panel
                  </h3>
                  <div style={{ fontSize: 10, color: '#00f0ff', fontWeight: 700, letterSpacing: '0.04em' }}>
                    12 SPECIALIZED VEHICLE AI DOMAINS
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ✕
              </button>
            </div>

            {/* Run Analysis Action Bar */}
            <div style={{ padding: '14px 24px', background: 'rgba(17, 24, 39, 0.65)', borderBottom: '1px solid var(--border-muted)' }}>
              <button
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="btn-primary"
                style={{
                  width: '100%', padding: '12px 18px', fontSize: 12, fontWeight: 900,
                  justifyContent: 'center', background: 'var(--accent)', color: '#080805',
                  borderRadius: 8, letterSpacing: '0.02em',
                }}
              >
                {isAnalyzing ? '⚡ Analyzing 12 AI Agent Domains…' : '🧠 RUN 12-AGENT TELEMETRY ANALYSIS →'}
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ padding: '14px 24px 6px 24px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', 'Powertrain', 'Safety', 'Hardware'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 14,
                    background: activeFilter === cat ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${activeFilter === cat ? '#00f0ff' : 'var(--border-muted)'}`,
                    color: activeFilter === cat ? '#00f0ff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {cat === 'Powertrain' ? '⚡ Powertrain' : cat === 'Safety' ? '🚨 Safety' : cat === 'Hardware' ? '🔧 Hardware' : '🌐 All 12'}
                </button>
              ))}
            </div>

            {/* Agent Cards Scroll List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredAgents.map(({ key, title, icon, color, role, descLine1, descLine2 }) => {
                const data = agentResults?.[key];
                const isReady = !!data;
                const confidence = data?.confidence_score ? Math.round(data.confidence_score * 100) : 95;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ x: -2 }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${isReady ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
                      borderLeft: `4px solid ${color}`,
                      borderRadius: 12, padding: '14px 16px',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                          {title}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color, background: `${color}18`, padding: '2px 8px', borderRadius: 10 }}>
                        {confidence}% Confidence
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: color, fontWeight: 700, marginBottom: 8, paddingLeft: 30 }}>
                      {role}
                    </div>

                    {/* 2-Line Clear Description */}
                    <div style={{
                      fontSize: 11, color: '#e2e8f0', lineHeight: 1.45, marginBottom: 10, paddingLeft: 30,
                      display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                      <div>• {descLine1}</div>
                      <div>• {descLine2}</div>
                    </div>

                    {/* Real-time telemetry output / advice */}
                    <div style={{
                      fontSize: 11, color: isReady ? '#00f0ff' : 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.45)', padding: '8px 12px', borderRadius: 8,
                      lineHeight: 1.35, border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      {data?.advice || data?.reasoning || data?.driving_style || data?.grid_status || data?.recommended_action || data?.overall_vehicle_health || '⚡ Agent active & monitoring vehicle telemetry'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-muted)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              EV Multi-Agent OS v2.0 · 12 AI Vehicle Domains Operational
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
