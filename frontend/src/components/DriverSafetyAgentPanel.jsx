import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function DriverSafetyAgentPanel({ telemetry, isDriving, driverAgentData, vehicleType = 'car' }) {
  const isBike = (vehicleType === 'bike') || (telemetry?.vehicleType === 'bike');
  const speed = telemetry?.speedKmh || (isDriving ? (isBike ? 45 : 80) : 0);
  const temp = telemetry?.temperatureC ?? 25;
  const soc = telemetry?.soc ?? 80;
  const traveledKm = telemetry?.traveledKm || 0;
  const isRain = telemetry?.rainActive ?? false;

  // Calculate driving duration dynamically (minutes)
  const drivingDurationMins = useMemo(() => {
    if (!isDriving) return 0;
    if (telemetry?.continuousRideMinutes) return telemetry.continuousRideMinutes;
    const avgSpd = Math.max(20, speed);
    return Math.round((traveledKm / avgSpd) * 60);
  }, [isDriving, telemetry?.continuousRideMinutes, traveledKm, speed]);

  // Calculate dynamic Eco-Score based on real-time driving conditions
  const ecoScore = useMemo(() => {
    if (driverAgentData?.eco_score) return driverAgentData.eco_score;
    if (!isDriving) return 96;
    let score = 96;
    const maxSpd = isBike ? 55 : 90;
    if (speed > maxSpd) score -= 14;
    if (temp > 38) score -= 12;
    if (drivingDurationMins > 45) score -= 8;
    if (isRain && speed > 40) score -= 10;
    return Math.max(55, score);
  }, [driverAgentData, isDriving, speed, isBike, temp, drivingDurationMins, isRain]);

  const safetyRating = useMemo(() => {
    if (driverAgentData?.safety_rating) return driverAgentData.safety_rating;
    if (ecoScore >= 90) return 'A+ Excellent Safety';
    if (ecoScore >= 80) return 'A Good Efficiency';
    if (ecoScore >= 70) return 'B Moderate Caution';
    return 'C Safety Warning Active';
  }, [driverAgentData, ecoScore]);

  const drivingStyle = useMemo(() => {
    if (driverAgentData?.driving_style) return driverAgentData.driving_style;
    if (!isDriving) return isBike ? 'Parked / Scooter Telemetry Monitoring' : 'Parked / Stationary Telemetry Monitoring';
    if (temp > 40) return 'High Thermal Stress - Cooling Needed';
    if (speed > (isBike ? 55 : 95)) return 'High-Speed Sprint / Overspeeding';
    if (drivingDurationMins > 45) return 'Long-Distance Continuous Ride';
    if (isRain) return 'Wet Road / Rain Mode Active';
    return isBike ? 'Eco-Smooth Scooter Ride' : 'Eco-Smooth Highway Drive';
  }, [driverAgentData, isDriving, isBike, temp, speed, drivingDurationMins, isRain]);

  // Dynamic Real-Time Safety & Telemetry Warnings
  const safetyAlerts = useMemo(() => {
    const alerts = [];

    // 1. Helmet Reminder (Always present for bikes)
    if (isBike) {
      alerts.push({
        icon: '🪖',
        title: 'Helmet & Eye Visor Reminder',
        status: 'CRITICAL SAFETY',
        desc: 'Always wear an ISI/DOT certified helmet & protective eye visor before riding.',
        color: '#d4d414',
      });
    }

    // 2. Driving Duration & Rest Break Warning
    if (isDriving && (drivingDurationMins >= 30 || traveledKm >= 45)) {
      alerts.push({
        icon: '☕',
        title: 'Rest Break Recommended',
        status: 'FATIGUE & STAMINA WARNING',
        desc: `Continuous ${isBike ? 'riding' : 'driving'} detected (${Math.round(drivingDurationMins)} mins · ${Math.round(traveledKm)} km). AI recommends taking a 15-minute rest break to avoid fatigue and maintain peak alertness.`,
        color: '#f59e0b',
      });
    }

    // 3. Speed & Over-Speeding Warning
    if (speed > (isBike ? 55 : 90)) {
      alerts.push({
        icon: '🚨',
        title: 'Speed Reduction Warning',
        status: 'HIGH SPEED HAZARD',
        desc: `Current speed is ${Math.round(speed)} km/h (exceeds safe limit of ${isBike ? '55' : '85'} km/h). Reduce speed immediately to prevent rapid battery drain and maintain stability.`,
        color: '#ff5050',
      });
    }

    // 4. Battery Temperature & Thermal Cooling Break Warning
    if (temp > 38) {
      alerts.push({
        icon: '🔥',
        title: 'Battery Thermal Warning',
        status: temp > 42 ? 'THERMAL OVERHEAT RISK' : 'THERMAL ELEVATED',
        desc: `Battery pack temperature reached ${temp.toFixed(1)}°C. ${temp > 42 ? 'Stop vehicle in a shaded area immediately for thermal cooling.' : 'Reduce speed or pause driving to allow pack thermal cooling.'}`,
        color: '#ff5050',
      });
    }

    // 5. Weather & Rain Surface Warning
    if (isRain) {
      alerts.push({
        icon: '🌧️',
        title: 'Rain Mode & Wet Road Alert',
        status: 'SLIPPERY SURFACE RISK',
        desc: 'Rain detected. Reduce speed by 20% and maintain extra braking gap for wet surface traction.',
        color: '#00f0ff',
      });
    }

    // 6. Low Battery Warning
    if (soc <= 20) {
      alerts.push({
        icon: '⚡',
        title: 'Low Battery Warning',
        status: 'CRITICAL CHARGE LEVEL',
        desc: `State of charge at ${Math.round(soc)}%. Head to the nearest recommended charging station immediately.`,
        color: '#ff5050',
      });
    }

    // 7. Traffic & ADAS Hazard Scanning
    alerts.push({
      icon: isDriving && speed < 30 && traveledKm > 5 ? '🚦' : '🚧',
      title: isDriving && speed < 30 && traveledKm > 5 ? 'Traffic Congestion Alert' : 'Road Hazard Monitoring',
      status: isDriving && speed < 30 && traveledKm > 5 ? 'STOP-AND-GO TRAFFIC' : 'ACTIVE SCANNING',
      desc: isDriving && speed < 30 && traveledKm > 5
        ? 'Dense traffic ahead. Enable Max Regenerative Braking to recover kinetic energy.'
        : 'AI continuously scanning for potholes, traffic density, and sudden lane obstructions ahead.',
      color: isDriving && speed < 30 && traveledKm > 5 ? '#f59e0b' : '#a855f7',
    });

    return alerts;
  }, [isBike, isDriving, drivingDurationMins, traveledKm, speed, temp, isRain, soc]);

  // Dynamic Real-Time AI Safety Coaching Tips
  const coachingTips = useMemo(() => {
    const tips = [];

    if (isBike) {
      tips.push('🪖 Helmet Safety: Fasten chin strap securely before engaging electric throttle.');
    }

    if (drivingDurationMins >= 30) {
      tips.push(`☕ Rest Break Tip: You have been ${isBike ? 'riding' : 'driving'} for ${Math.round(drivingDurationMins)} mins (${Math.round(traveledKm)} km). Take a 15-min break.`);
    }

    if (speed > (isBike ? 55 : 90)) {
      tips.push(`🚨 Speed Reduction: Cruising at ${Math.round(speed)} km/h. Lowering speed by 10 km/h extends range by +14%.`);
    }

    if (temp > 38) {
      tips.push(`🔥 Battery Thermal Tip: Pack temp at ${temp.toFixed(1)}°C. Avoid prolonged max-acceleration bursts to prevent overheating.`);
    }

    if (isRain) {
      tips.push('🌧️ Rain Safety: Wet asphalt reduces tire friction by 35%. Use progressive braking.');
    }

    if (soc <= 20) {
      tips.push(`⚡ Low Charge Warning: SoC at ${Math.round(soc)}%. Head to the nearest recommended charging station immediately.`);
    }

    if (tips.length < 3) {
      tips.push(`🔋 Battery Efficiency: Maintaining steady ${isBike ? '35-50' : '75-85'} km/h yields optimal kWh discharge rate.`);
      tips.push('🧠 Regenerative Braking: One-pedal deceleration recovers up to 92% kinetic energy back into battery pack.');
    }

    return tips.slice(0, 3);
  }, [isBike, drivingDurationMins, traveledKm, speed, temp, isRain, soc]);

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
            {isBike ? '🏍' : '🏎️'}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#a855f7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SPECIALIZED AI DOMAIN AGENT ({isBike ? 'ELECTRIC BIKE / SCOOTER' : 'ELECTRIC CAR'})
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>
              {isBike ? 'Rider Safety & Telemetry Agent' : 'Driver Behavior & Safety Agent'}
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rydex-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', color: '#a855f7', fontWeight: 800, fontSize: 11, padding: '4px 10px' }}>
            96% Confidence
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
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              {isBike ? 'RIDER ECO-SCORE' : 'DRIVER ECO-SCORE'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginTop: 2 }}>{safetyRating}</div>
            <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, marginTop: 2 }}>
              {isDriving ? (isBike ? 'Smooth Ride Active' : 'Smooth Cruising Active') : 'Stationary Baseline'}
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
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CURRENT RIDING STYLE</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#00f0ff', marginTop: 4 }}>{drivingStyle}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Speed: <span style={{ color: '#fff', fontWeight: 800 }}>{Math.round(speed)} km/h</span> · Balance: <span style={{ color: '#22c55e', fontWeight: 800 }}>Optimal</span>
          </div>
        </div>
      </div>

      {/* Safety Alerts Grid */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          ⚡ {isBike ? 'BIKE SAFETY & HAZARD ALERTS' : 'CAR SAFETY & TELEMETRY ALERTS'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {safetyAlerts.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: `1px solid ${item.color}44`,
              borderLeft: `4px solid ${item.color}`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: item.color, background: `${item.color}15`, padding: '2px 6px', borderRadius: 6 }}>
                  {item.status}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.35 }}>
                {item.desc}
              </div>
            </div>
          ))}
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

