import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getVehicleConfig } from '../utils/vehicleConfig';

/**
 * BikeDigitalTwin3D Component
 * 3D / Side-View High-Tech Electric Scooter Digital Twin (Ola S1 Pro & Electric Bikes)
 * Features:
 * - Loads vehicle image dynamically from vehicleConfig (e.g. /vehicles/ola-s1-pro.png)
 * - Animated spinning ground motion & laser scanning sweep
 * - Battery charging animation & glowing power flows
 * - Dynamic color transitions: Green = Healthy, Yellow = Charging, Red = Critical Battery / Overheat
 * - Animated charging cable connection when in charging mode
 */
export default function BikeDigitalTwin3D({
  telemetry,
  vehicleName = 'Ola S1 Pro',
  speedKmh = 0,
  mode = 'idle',
}) {
  const soc = telemetry?.soc ?? 80;
  const temp = telemetry?.temperatureC ?? 25;
  const isCharging = mode === 'charging';
  const isDriving = mode === 'driving';
  const isCritical = soc <= 20 || temp > 42;

  const vConfig = getVehicleConfig(vehicleName, 'bike');
  const [imgSrc, setImgSrc] = useState(vConfig.image || '/vehicles/ola-s1-pro.png');

  useEffect(() => {
    setImgSrc(vConfig.image || '/vehicles/ola-s1-pro.png');
  }, [vehicleName, vConfig.image]);

  // Dynamic Theme Color: Green (Healthy), Yellow (Charging), Red (Critical)
  const themeColor = isCritical
    ? '#ff5050'
    : isCharging
    ? '#d4d414'
    : '#22c55e';

  const glowShadow = isCritical
    ? '0 0 35px rgba(255, 80, 80, 0.6)'
    : isCharging
    ? '0 0 35px rgba(212, 212, 20, 0.6)'
    : '0 0 30px rgba(34, 197, 94, 0.4)';

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', borderRadius: 16, background: '#070705',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}>
      {/* Background Radial Ambient Lighting */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDriving
          ? 'radial-gradient(ellipse at 50% 60%, rgba(0,240,255,0.18) 0%, rgba(8,8,5,0.95) 75%)'
          : `radial-gradient(ellipse at 50% 60%, ${themeColor}18 0%, rgba(8,8,5,0.95) 75%)`,
        pointerEvents: 'none',
      }} />

      {/* Cyber Grid Ground Perspective */}
      <div style={{
        position: 'absolute', bottom: -25, width: '100%', height: '45%',
        backgroundImage: `linear-gradient(${themeColor}22 1px, transparent 1px), linear-gradient(90deg, ${themeColor}22 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        transform: 'perspective(400px) rotateX(68deg)',
        pointerEvents: 'none', opacity: 0.75,
      }} />

      {/* Dynamic Ground Speed Motion Trails when driving */}
      {isDriving && (
        <motion.div
          style={{
            position: 'absolute', bottom: '14%', width: '100%', height: '25%',
            backgroundImage: `repeating-linear-gradient(90deg, ${themeColor}66 0, ${themeColor}66 30px, transparent 30px, transparent 80px)`,
            backgroundSize: '200% 100%',
            transform: 'perspective(300px) rotateX(70deg)',
            pointerEvents: 'none', zIndex: 2, filter: 'blur(2px)',
          }}
          animate={{ backgroundPosition: ['-100% 0', '100% 0'] }}
          transition={{ repeat: Infinity, duration: Math.max(0.15, 1.0 - speedKmh / 120), ease: 'linear' }}
        />
      )}

      {/* Pulsing Chassis Underglow Aura */}
      <motion.div
        style={{
          position: 'absolute', bottom: '15%', width: '70%', height: '20%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 50%, ${themeColor}aa 0%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none', zIndex: 2,
        }}
        animate={{ opacity: [0.5, 0.95, 0.5], scale: [0.96, 1.04, 0.96] }}
        transition={{ repeat: Infinity, duration: isDriving ? 0.6 : 2, ease: 'easeInOut' }}
      />

      {/* Sci-Fi Laser Scanning Beam */}
      <motion.div
        style={{
          position: 'absolute', left: '10%', right: '10%', height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${themeColor} 50%, transparent 100%)`,
          boxShadow: `0 0 12px ${themeColor}`,
          pointerEvents: 'none', zIndex: 5, opacity: 0.8,
        }}
        animate={{ top: ['20%', '80%', '20%'] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
      />

      {/* Scooter Main Graphic Container & Hero Image */}
      <motion.div
        animate={{ y: isDriving ? [0, -4, 0] : [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: isDriving ? 0.4 : 3, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <motion.img
          src={imgSrc}
          onError={() => setImgSrc(vConfig.fallbackImage || '/vehicles/ola-s1-pro.jpg')}
          alt={vehicleName}
          whileHover={{ scale: 1.03 }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            filter: isCritical
              ? 'brightness(0.9) drop-shadow(0 10px 20px rgba(255,80,80,0.6))'
              : isCharging
              ? 'brightness(1.08) drop-shadow(0 10px 25px rgba(212,212,20,0.65))'
              : isDriving
              ? 'brightness(1.1) drop-shadow(0 12px 25px rgba(0,240,255,0.65))'
              : 'brightness(1.04) drop-shadow(0 10px 20px rgba(0,0,0,0.85))',
            zIndex: 3,
            transition: 'filter 0.4s ease',
          }}
        />

        {/* Dynamic Energy Flow Arcs Overlay */}
        <svg width="100%" height="100%" viewBox="0 0 440 280" fill="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          <defs>
            <linearGradient id="accent-glow" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.2" />
              <stop offset="50%" stopColor={themeColor} stopOpacity="1" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Charging Cable Animation when in Charging Mode */}
          {isCharging && (
            <g>
              {/* Station Plug Stand */}
              <rect x="15" y="140" width="24" height="60" rx="4" fill="#1e293b" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="27" cy="155" r="4" fill="var(--accent)" />
              {/* Glowing High Voltage Cable */}
              <motion.path
                d="M27 170 C60 220 140 210 200 175"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [0, -30] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                filter="drop-shadow(0 0 8px #d4d414)"
              />
              {/* Charge Port Indicator Glow */}
              <circle cx="200" cy="175" r="6" fill="var(--accent)" filter="drop-shadow(0 0 10px #d4d414)" />
            </g>
          )}
        </svg>
      </motion.div>

      {/* Top Left Status Badge */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 16px',
        background: 'rgba(17, 17, 16, 0.88)',
        border: `1px solid ${themeColor}66`,
        borderRadius: 20,
        backdropFilter: 'blur(12px)',
        boxShadow: glowShadow,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: themeColor, boxShadow: `0 0 8px ${themeColor}` }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: themeColor, fontFamily: 'var(--font-heading)' }}>
          {isCritical ? '🚨 Critical / Overheat' : isCharging ? '⚡ Charging 2.5 kW' : isDriving ? '🏍 Riding Active' : '🅿️ Scooter Parked'}
        </span>
      </div>

      {/* Top Right Model Badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        background: 'rgba(17, 17, 16, 0.88)', padding: '6px 14px', borderRadius: 20,
        border: '1px solid var(--border-muted)', backdropFilter: 'blur(12px)',
        fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)', letterSpacing: '0.04em',
      }}>
        🏍 {vehicleName.toUpperCase()} (ELECTRIC BIKE)
      </div>

      {/* Bottom Left Speedometer Badge */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(15, 23, 42, 0.88)', padding: '8px 16px', borderRadius: 14,
        border: `1px solid ${themeColor}55`, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
            RIDE SPEED
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: isDriving ? themeColor : '#fff', lineHeight: 1 }}>
            {Math.round(speedKmh)} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>KM/H</span>
          </div>
        </div>
      </div>

      {/* Bottom Right Battery Arc Indicator */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        background: 'rgba(17, 17, 16, 0.88)', padding: '8px 12px', borderRadius: 12,
        border: '1px solid var(--border-muted)', backdropFilter: 'blur(12px)',
      }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#2e2e2b" strokeWidth="3.5" />
          <circle
            cx="28" cy="28" r="22" fill="none"
            stroke={themeColor} strokeWidth="3.5"
            strokeDasharray={`${(soc / 100) * 138} 138`}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12, fill: themeColor }}>
            {Math.round(soc)}%
          </text>
        </svg>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800 }}>BATTERY</span>
      </div>
    </div>
  );
}
