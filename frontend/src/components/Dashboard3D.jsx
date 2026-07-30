import { motion, AnimatePresence } from 'framer-motion';

// ── Status overlay badge ───────────────────────────────────────────────────────
function StatusBadge({ mode, soc }) {
  const color = soc < 15 ? '#ff5050' : soc < 30 ? '#f59e0b' : mode === 'charging' ? '#d4d414' : '#22c55e';
  const label = soc < 15 ? '🚨 Critical Battery'
    : soc < 30 ? '⚠️ Low Battery'
    : mode === 'charging' ? '⚡ Charging'
    : mode === 'driving' ? '🚗 Driving'
    : '🅿️ Parked';

  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 16px',
      background: 'rgba(17, 17, 16, 0.85)',
      border: `1px solid ${color}66`,
      borderRadius: 20,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
        {label}
      </span>
    </div>
  );
}

// ── SoC Arc indicator ─────────────────────────────────────────────────────────
function SocArc({ soc }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (soc / 100) * circ;
  const color = soc < 15 ? '#ff5050' : soc < 30 ? '#f59e0b' : '#d4d414';

  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'rgba(17, 17, 16, 0.85)', padding: '8px 12px', borderRadius: 12,
      border: '1px solid var(--border-muted)', backdropFilter: 'blur(12px)',
    }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#2e2e2b" strokeWidth="3.5" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="30" y="30" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 13, fill: color }}>
          {Math.round(soc)}%
        </text>
      </svg>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>SOC</span>
    </div>
  );
}

// ── Speedometer Gauge Component (reserved for future use) ────────────────────
// eslint-disable-next-line no-unused-vars
function SpeedometerGauge({ speedKmh = 0, mode = 'idle', soc = 80 }) {
  const isDriving = mode === 'driving';
  const speed = Math.min(220, Math.max(0, speedKmh));
  // Angle: 0 km/h = -135deg, 220 km/h = +135deg (270deg sweep)
  const angle = (speed / 220) * 270 - 135;

  const ticks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 12, background: 'radial-gradient(ellipse at center, #0f172a 0%, #080805 85%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: '1px solid var(--border-muted)', overflow: 'hidden', padding: 20,
    }}>
      {/* Background speed grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(#00f0ff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Main Dial Container */}
      <div style={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="280" height="280" viewBox="0 0 280 280">
          {/* Outer Ring */}
          <circle cx="140" cy="140" r="128" fill="none" stroke="#1e293b" strokeWidth="6" />

          {/* Tick marks and labels */}
          {ticks.map((t) => {
            const tickAngle = (t / 220) * 270 - 135;
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const r1 = 112;
            const r2 = 124;
            const x1 = 140 + r1 * Math.cos(rad);
            const y1 = 140 + r1 * Math.sin(rad);
            const x2 = 140 + r2 * Math.cos(rad);
            const y2 = 140 + r2 * Math.sin(rad);

            const labelR = 96;
            const lx = 140 + labelR * Math.cos(rad);
            const ly = 140 + labelR * Math.sin(rad);

            const isCurrent = Math.abs(speed - t) < 15;

            return (
              <g key={t}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isCurrent ? '#00f0ff' : t > 140 ? '#ff5050' : '#475569'}
                  strokeWidth={t % 40 === 0 ? 3 : 1.5}
                />
                {t % 20 === 0 && (
                  <text
                    x={lx} y={ly}
                    fill={isCurrent ? '#00f0ff' : t > 140 ? '#ff8080' : '#94a3b8'}
                    fontSize="11"
                    fontWeight={isCurrent ? '800' : '600'}
                    fontFamily="var(--font-heading)"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {t}
                  </text>
                )}
              </g>
            );
          })}

          {/* Active speed progress arc */}
          <circle
            cx="140" cy="140" r="118" fill="none"
            stroke="url(#speed-gradient)" strokeWidth="6"
            strokeDasharray={`${(speed / 220) * 556} 600`}
            strokeLinecap="round"
            transform="rotate(135 140 140)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />

          <defs>
            <linearGradient id="speed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="60%" stopColor="#d4d414" />
              <stop offset="100%" stopColor="#ff5050" />
            </linearGradient>
          </defs>
        </svg>

        {/* Speedometer Needle */}
        <div style={{
          position: 'absolute', width: 280, height: 280,
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', top: 38, width: 4, height: 102,
            background: 'linear-gradient(to top, #ff5050, #00f0ff)',
            borderRadius: 2,
            boxShadow: '0 0 12px #00f0ff',
          }} />
        </div>

        {/* Center Digital Speed Readout */}
        <div style={{
          position: 'absolute', textAlign: 'center', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 48, fontWeight: 900,
            color: isDriving ? '#00f0ff' : 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            textShadow: isDriving ? '0 0 20px rgba(0,240,255,0.6)' : 'none',
          }}>
            {Math.round(speed)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>
            KM / H
          </div>
        </div>
      </div>

      {/* Gear Selector Indicator Bar */}
      <div style={{
        marginTop: 16, display: 'flex', gap: 16, alignItems: 'center',
        background: 'rgba(15,23,42,0.8)', padding: '6px 18px', borderRadius: 20,
        border: '1px solid var(--border-muted)',
      }}>
        {[
          { gear: 'P', name: 'PARK', active: mode === 'idle' },
          { gear: 'R', name: 'REV', active: false },
          { gear: 'N', name: 'NEUT', active: false },
          { gear: 'D', name: 'DRIVE', active: isDriving },
        ].map(({ gear, active }) => (
          <span key={gear} style={{
            fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-heading)',
            color: active ? '#00f0ff' : 'var(--text-muted)',
            padding: '2px 8px', borderRadius: 6,
            background: active ? 'rgba(0,240,255,0.15)' : 'transparent',
            boxShadow: active ? '0 0 10px rgba(0,240,255,0.4)' : 'none',
            transition: 'all 0.3s ease',
          }}>
            {gear}
          </span>
        ))}
      </div>

      {/* Vehicle State Status */}
      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: isDriving ? '#22c55e' : 'var(--text-secondary)' }}>
        {isDriving ? '🚗 VEHICLE IN MOTION — LIVE TELEMETRY SIMULATION' : '🅿️ VEHICLE PARKED'}
      </div>
    </div>
  );
}

// ── Executive Vehicle Display View (Clean, Premium, Static with Holographic Accents) ─────────
function VehicleImageView({ soc, mode, speedKmh = 0, vehicleName = 'Porsche Taycan EV' }) {
  const isCharging = mode === 'charging';
  const isDriving = mode === 'driving';
  const isCritical = soc < 15;
  const isTata = vehicleName.toLowerCase().includes('tata') || vehicleName.toLowerCase().includes('safari');
  const imageSrc = isTata ? '/tata_safari_ev.png' : '/ev_car.png';

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', borderRadius: 12, background: '#070705',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Radial spotlight behind vehicle */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isDriving
          ? 'radial-gradient(ellipse at 50% 60%, rgba(0,240,255,0.2) 0%, rgba(8,8,5,0.95) 75%)'
          : 'radial-gradient(ellipse at 50% 60%, rgba(212,212,20,0.14) 0%, rgba(8,8,5,0.95) 75%)',
        pointerEvents: 'none',
      }} />

      {/* Dynamic Moving Road Matrix Grid */}
      <div style={{
        position: 'absolute', bottom: -20, width: '100%', height: '45%',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,240,255,0.18) 0%, transparent 75%)',
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.15) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        transform: 'perspective(400px) rotateX(65deg)',
        pointerEvents: 'none', opacity: 0.85,
      }} />

      {/* Dynamic Animated Ground Speed Trail Lines when driving */}
      {isDriving && (
        <motion.div
          style={{
            position: 'absolute', bottom: '12%', width: '100%', height: '30%',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,240,255,0.4) 0, rgba(0,240,255,0.4) 40px, transparent 40px, transparent 90px)',
            backgroundSize: '200% 100%',
            transform: 'perspective(300px) rotateX(70deg)',
            pointerEvents: 'none', zIndex: 2, filter: 'blur(2px)',
          }}
          animate={{ backgroundPosition: ['-100% 0', '100% 0'] }}
          transition={{ repeat: Infinity, duration: Math.max(0.2, 1.2 - speedKmh / 150), ease: 'linear' }}
        />
      )}

      {/* Pulsing Chassis Underglow Aura */}
      <motion.div
        style={{
          position: 'absolute', bottom: '8%', width: '82%', height: '28%',
          borderRadius: '50%',
          background: isCritical
            ? 'radial-gradient(ellipse at 50% 50%, rgba(255,80,80,0.55) 0%, transparent 70%)'
            : isCharging
            ? 'radial-gradient(ellipse at 50% 50%, rgba(212,212,20,0.55) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(0,240,255,0.45) 0%, transparent 70%)',
          filter: 'blur(18px)',
          pointerEvents: 'none', zIndex: 2,
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
        transition={{ repeat: Infinity, duration: isDriving ? 0.8 : 2, ease: 'easeInOut' }}
      />

      {/* Sci-Fi Holographic Scanning Laser Sweep Beam */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 5%, #00f0ff 50%, transparent 95%)',
          boxShadow: '0 0 15px #00f0ff, 0 0 30px #00f0ff',
          pointerEvents: 'none', zIndex: 5, opacity: 0.75,
        }}
        animate={{ top: ['15%', '85%', '15%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />

      {/* Driving Hyper-Drive Speed Streamer Rays */}
      {isDriving && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(90deg, transparent 35%, rgba(0,240,255,0.25) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            pointerEvents: 'none', zIndex: 3,
          }}
          animate={{ backgroundPosition: ['-100% 0', '100% 0'] }}
          transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }}
        />
      )}

      {/* Charging High-Voltage Energy Arcs */}
      {isCharging && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(212,212,20,0.25) 0%, transparent 65%)',
            pointerEvents: 'none', zIndex: 3,
          }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.96, 1.04, 0.96] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      )}

      {/* Critical Red Emergency Warning Halo */}
      {isCritical && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,80,80,0.3) 0%, transparent 75%)',
            pointerEvents: 'none', zIndex: 3,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}

      {/* Vehicle Image — smooth subtle hover, no shake */}
      <motion.img
        src={imageSrc}
        alt={vehicleName}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: isDriving ? 2 : 3.5, ease: 'easeInOut' }}
        whileHover={{ scale: 1.04 }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: isTata ? 'center center' : 'center 40%',
          scale: isDriving ? '1.06' : '1.02',
          filter: isCritical
            ? 'brightness(0.85) sepia(0.3) hue-rotate(-10deg) drop-shadow(0 15px 25px rgba(255,80,80,0.5))'
            : isCharging
            ? 'brightness(1.08) contrast(1.05) drop-shadow(0 15px 25px rgba(212,212,20,0.5))'
            : isDriving
            ? 'brightness(1.12) contrast(1.1) drop-shadow(0 18px 30px rgba(0,240,255,0.55))'
            : 'brightness(1.04) drop-shadow(0 15px 25px rgba(0,0,0,0.85))',
          zIndex: 4,
          transition: 'filter 0.4s ease',
        }}
      />



      {/* Vignette border framing */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 70px rgba(0,0,0,0.75)',
        pointerEvents: 'none', zIndex: 6,
      }} />

      {/* Status & SoC Overlays */}
      <StatusBadge mode={mode} soc={soc} />

      {/* Live Speedometer Mini Overlay Badge bottom-left */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(15, 23, 42, 0.88)', padding: '8px 16px', borderRadius: 14,
        border: '1px solid rgba(0, 240, 255, 0.4)', backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
            SPEEDOMETER
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: isDriving ? '#00f0ff' : 'var(--text-primary)', lineHeight: 1 }}>
            {Math.round(speedKmh)} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>KM/H</span>
          </div>
        </div>
      </div>

      <SocArc soc={soc} />

      {/* Model Spec Badge top-right */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        background: 'rgba(17, 17, 16, 0.85)', padding: '6px 14px', borderRadius: 20,
        border: '1px solid var(--border-muted)', backdropFilter: 'blur(12px)',
        fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
        fontFamily: 'var(--font-heading)',
      }}>
        {vehicleName?.toUpperCase() || 'PORSCHE TAYCAN EV'}
      </div>
    </div>
  );
}

// ── 2D Executive Battery Management & Capacity Gauge ──────────────────────────
function BatteryGaugeView({ telemetry }) {
  const soc = telemetry?.soc ?? 75;
  const soh = typeof telemetry?.soh === 'number' ? telemetry.soh.toFixed(1) : (telemetry?.soh ?? '95.0');
  const temp = telemetry?.temperatureC ?? 25;

  const maxCapacityKwh = 90; // 90 kWh Max Capacity
  const currentEnergyKwh = +((soc / 100) * maxCapacityKwh).toFixed(1);
  const color = soc < 15 ? '#ff5050' : soc < 30 ? '#f59e0b' : '#22c55e';
  const accentColor = 'var(--accent)';

  // 8 Battery modules in the pack
  const filledModules = Math.round((soc / 100) * 8);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 12, background: '#0a0a07', padding: '24px 28px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      border: '1px solid var(--border-muted)', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', right: -40, top: -40, width: 220, height: 220,
        borderRadius: '50%', background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
          }}>
            HIGH-VOLTAGE BATTERY ARCHITECTURE
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, margin: 0 }}>
            90.0 kWh Performance Pack
          </h3>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(212, 212, 20, 0.1)', border: '1px solid rgba(212, 212, 20, 0.3)',
          color: 'var(--accent)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-heading)',
        }}>
          800V Nominal Architecture
        </div>
      </div>

      {/* Main Energy Meter Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center', margin: '16px 0', zIndex: 2 }}>

        {/* Left: Capacity Gauge & Big Number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke="#20201c" strokeWidth="8" />
              <circle
                cx="55" cy="55" r="46" fill="none"
                stroke={color} strokeWidth="8"
                strokeDasharray={`${(soc / 100) * 289} 289`}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', lineHeight: 1 }}>
                {Math.round(soc)}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                CHARGE
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
              Current Energy Stored
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: accentColor, lineHeight: 1.1 }}>
              {currentEnergyKwh} <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>kWh</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
              out of <strong style={{ color: 'var(--text-primary)' }}>90.0 kWh</strong> Max Capacity
            </div>
          </div>
        </div>

        {/* Right: Key Specs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          padding: '14px 18px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-muted)', borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MAX CAPACITY
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginTop: 2 }}>
              90.0 kWh
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              HEALTH (SOH)
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: '#22c55e', marginTop: 2 }}>
              {soh}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              TEMPERATURE
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: temp > 40 ? '#ff5050' : 'var(--text-primary)', marginTop: 2 }}>
              {temp}°C
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              FAST CHARGE MAX
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--accent)', marginTop: 2 }}>
              270 kW
            </div>
          </div>
        </div>
      </div>

      {/* Battery Module Cell Bank Visualizer */}
      <div style={{ zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>8-CELL MODULE PACK STATUS</span>
          <span style={{ color: color, fontWeight: 700 }}>{filledModules}/8 Active Modules ({currentEnergyKwh} kWh Available)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const isActive = i < filledModules;
            return (
              <div
                key={i}
                style={{
                  height: 18,
                  borderRadius: 4,
                  background: isActive ? `${color}dd` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? color : 'var(--border-muted)'}`,
                  boxShadow: isActive ? `0 0 8px ${color}66` : 'none',
                  transition: 'all 0.5s ease',
                }}
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ── Live 11-Agent Intelligence Hub Viewer ──────────────────────────────────────
function AgentHubView({ agentResults }) {
  const allAgentsMeta = [
    { key: 'battery', title: 'Battery Intelligence', icon: '🔋', color: '#22c55e', role: 'SoC & Health Monitoring' },
    { key: 'route', title: 'Route Intelligence', icon: '🗺️', color: '#00f0ff', role: 'GPS Polyline & ETA' },
    { key: 'charging', title: 'Charging Intelligence', icon: '⚡', color: '#d4d414', role: 'Optimal Station Recommendation' },
    { key: 'emergency', title: 'Emergency Assistance', icon: '🚨', color: '#ff5050', role: 'Critical Diagnostics & Safety' },
    { key: 'energy', title: 'Energy & Sustainability', icon: '🌱', color: '#22c55e', role: 'Carbon Footprint & Eco Score' },
    { key: 'pricing', title: 'Pricing & Cost', icon: '💰', color: '#f59e0b', role: 'Tariff & Cost Savings' },
    { key: 'analytics', title: 'Analytics & Reports', icon: '📊', color: '#60a5fa', role: 'Performance Metrics' },
    { key: 'weather', title: 'Weather & Climate', icon: '🌤️', color: '#38bdf8', role: 'Thermal & HVAC Load' },
    { key: 'driver', title: 'Driver Behavior & Safety', icon: '🏎️', color: '#a855f7', role: 'Regen & Driving Style' },
    { key: 'grid', title: 'Grid Load & V2G', icon: '🔌', color: '#ec4899', role: 'Renewable & Microgrid' },
    { key: 'maintenance', title: 'Predictive Maintenance', icon: '🔧', color: '#f97316', role: 'Tire, Brake & Hardware' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 12, background: '#0a0d17', padding: '16px 20px',
      border: '1px solid var(--border-muted)', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>
            11 SPECIALIZED DOMAIN AI AGENTS
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
            Multi-Agent Intelligence Network Hub
          </div>
        </div>
        <span className="rydex-badge accent" style={{ fontSize: 10 }}>11 Active Agents</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {allAgentsMeta.map(({ key, title, icon, color, role }) => {
          const data = agentResults?.[key];
          const isReady = !!data;
          const confidence = data?.confidence_score ? Math.round(data.confidence_score * 100) : 94;

          return (
            <div
              key={key}
              style={{
                background: 'rgba(17, 24, 39, 0.8)',
                border: `1px solid ${isReady ? `${color}44` : 'var(--border-muted)'}`,
                borderTop: `3px solid ${color}`,
                borderRadius: 10, padding: '10px 12px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '1px 6px', borderRadius: 10 }}>
                  {confidence}%
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                {title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {role}
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: isReady ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data?.advice || data?.reasoning || data?.driving_style || data?.grid_status || 'System Active & Monitoring'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Dashboard Viewer — Full Sized Porsche EV car view + 2D Battery Capacity Gauge
 */
export default function Dashboard3D({ telemetry, activeAgents, agentResults, view = 'vehicle', vehicleName = 'Porsche Taycan EV' }) {
  const soc = telemetry?.soc ?? 80;
  const mode = telemetry?.mode ?? 'idle';
  const speedKmh = telemetry?.speedKmh ?? 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait">

        {/* ── Vehicle: Full-Sized Vehicle View ── */}
        {(view === 'vehicle' || view === 'speedometer') && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%' }}
          >
            <VehicleImageView soc={soc} mode={mode} speedKmh={speedKmh} vehicleName={vehicleName} />
          </motion.div>
        )}

        {/* ── Battery view: Executive 2D Capacity Gauge ── */}
        {(view === 'battery' || view === 'agents') && (
          <motion.div
            key="battery"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%' }}
          >
            <BatteryGaugeView telemetry={telemetry} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
