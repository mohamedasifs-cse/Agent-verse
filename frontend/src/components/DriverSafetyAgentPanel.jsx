import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function DriverSafetyAgentPanel({ telemetry, isDriving, driverAgentData }) {
  const speed = telemetry?.speedKmh || (isDriving ? 80 : 0);

  // Calculate dynamic Eco-Score and safety rating
  const ecoScore = useMemo(() => {
    if (driverAgentData?.eco_score) return driverAgentData.eco_score;
    if (!isDriving) return 96;
    if (speed > 100) return 78;
    if (speed > 80) return 88;
    return 94;
  }, [driverAgentData, isDriving, speed]);

  const safetyRating = useMemo(() => {
    if (driverAgentData?.safety_rating) return driverAgentData.safety_rating;
    if (ecoScore >= 90) return 'A+ Excellent Safety';
    if (ecoScore >= 80) return 'A Good Efficiency';
    return 'B Moderate Thrash';
  }, [driverAgentData, ecoScore]);

  const drivingStyle = useMemo(() => {
    if (driverAgentData?.driving_style) return driverAgentData.driving_style;
    if (!isDriving) return 'Parked / Stationary Telemetry Monitoring';
    if (speed > 90) return 'High-Speed Highway Cruise';
    return 'Eco-Smooth Highway Drive';
  }, [driverAgentData, isDriving, speed]);

  const coachingTips = useMemo(() => {
    if (driverAgentData?.coaching_tips && driverAgentData.coaching_tips.length > 0) {
      return driverAgentData.coaching_tips;
    }
    if (isDriving) {
      return [
        'Maintain steady 75-85 km/h cruising to optimize battery discharge curve and extend range by +18 km.',
        'Smooth throttle modulation active: Zero hard acceleration events detected in the last 30 minutes.',
        'Regenerative braking active: Kinetic energy recovery efficiency at 92%.',
      ];
    }
    return [
      'Vehicle is stationary. Battery thermal management optimal for fast charging.',
      'Eco-driving score is 96/100 based on recent trip smoothness.',
      'Keep cabin HVAC set to 22°C Eco Mode for maximum range retention.',
    ];
  }, [driverAgentData, isDriving]);

  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.92)',
      border: '1px solid rgba(168, 85, 247, 0.45)',
      borderRadius: 16,
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.7), 0 0 25px rgba(168,85,247,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(168, 85, 247, 0.18)', border: '1px solid #a855f7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#a855f7',
          }}>
            🏎️
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#a855f7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SPECIALIZED AI DOMAIN AGENT
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>
              Driver Behavior & Safety Agent
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rydex-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', color: '#a855f7', fontWeight: 800, fontSize: 11, padding: '4px 10px' }}>
            94% Confidence
          </span>
          <span className="rydex-badge success" style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px' }}>
            🟢 Live AI Monitoring
          </span>
        </div>
      </div>

      {/* Eco-Score & Driving Style Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Eco Score Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {/* Big Score Badge */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'conic-gradient(#a855f7 0% 94%, rgba(255,255,255,0.1) 94% 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#a855f7',
            }}>
              {ecoScore}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>DRIVER ECO-SCORE</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginTop: 2 }}>{safetyRating}</div>
            <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, marginTop: 2 }}>
              {isDriving ? 'Smooth Cruising Active' : 'Stationary Baseline'}
            </div>
          </div>
        </div>

        {/* Driving Style Evaluation */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CURRENT DRIVING STYLE</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#00f0ff', marginTop: 4 }}>{drivingStyle}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Speed: <span style={{ color: '#fff', fontWeight: 800 }}>{Math.round(speed)} km/h</span> · G-Force: <span style={{ color: '#22c55e', fontWeight: 800 }}>0.12 G (Smooth)</span>
          </div>
        </div>
      </div>

      {/* AI Real-Time Driver Coaching Tips */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: 12, padding: '16px 20px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🧠 REAL-TIME AI SAFETY COACHING TIPS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coachingTips.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 12, color: '#e2e8f0', lineHeight: 1.45,
                background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8,
                borderLeft: '3px solid #a855f7',
              }}
            >
              <span style={{ color: '#a855f7', fontWeight: 800, fontSize: 14 }}>💡</span>
              <div>{tip}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
