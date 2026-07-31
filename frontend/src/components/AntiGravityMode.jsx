import { useEffect } from 'react';
import { motion } from 'framer-motion';

// Helper function for Web Speech API text-to-speech
export function speakAntiGravityVoice(text) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

// ── Particle Generator Component for Anti-Gravity Mode ────────────────────────
export function AntiGravityParticles() {
  // Generate static positions for 14 floating dust & energy particles
  const particles = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    left: `${8 + (i * 7) % 84}%`,
    bottom: `${10 + (i * 6) % 30}%`,
    size: 4 + (i % 5) * 2,
    duration: 1.8 + (i % 4) * 0.5,
    delay: (i % 5) * 0.3,
    color: i % 2 === 0 ? '#00f0ff' : '#d4d414',
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6, overflow: 'hidden' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}`,
          }}
          animate={{
            y: [-10, -80, -120],
            x: [0, (p.id % 2 === 0 ? 15 : -15), (p.id % 2 === 0 ? -10 : 10)],
            opacity: [0, 0.9, 0],
            scale: [0.6, 1.4, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Glowing Blue Energy Ring & Electric Lines ──────────────────────────────────
export function EnergyRingEffect() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Blue Energy Pulse Ring */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '10%',
          width: '78%',
          height: '24%',
          borderRadius: '50%',
          border: '2px solid #00f0ff',
          boxShadow: '0 0 35px #00f0ff, 0 0 70px rgba(0, 240, 255, 0.6), inset 0 0 30px #00f0ff',
          background: 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.35) 0%, rgba(212, 212, 20, 0.2) 45%, transparent 75%)',
        }}
        animate={{
          scale: [0.94, 1.06, 0.94],
          opacity: [0.75, 1, 0.75],
          boxShadow: [
            '0 0 25px #00f0ff, 0 0 50px rgba(0,240,255,0.5), inset 0 0 20px #00f0ff',
            '0 0 45px #00f0ff, 0 0 90px rgba(0,240,255,0.8), inset 0 0 40px #00f0ff',
            '0 0 25px #00f0ff, 0 0 50px rgba(0,240,255,0.5), inset 0 0 20px #00f0ff',
          ],
        }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      />

      {/* Inner Electric Power Line Beams */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '12%',
          width: '60%',
          height: '16%',
          borderRadius: '50%',
          border: '1.5px dashed #d4d414',
          boxShadow: '0 0 20px #d4d414',
        }}
        animate={{ rotate: 360, opacity: [0.5, 0.9, 0.5] }}
        transition={{ rotate: { repeat: Infinity, duration: 8, ease: 'linear' }, opacity: { repeat: Infinity, duration: 1.2 } }}
      />

      {/* Vertical Anti-Gravity Lift Energy Beams */}
      {[-25, -10, 0, 10, 25].map((offsetPercent, idx) => (
        <motion.div
          key={idx}
          style={{
            position: 'absolute',
            bottom: '11%',
            left: `${50 + offsetPercent}%`,
            width: 3,
            height: '25%',
            background: 'linear-gradient(to top, rgba(0,240,255,0.8), rgba(212,212,20,0.8), transparent)',
            boxShadow: '0 0 12px #00f0ff',
            borderRadius: 2,
          }}
          animate={{
            height: ['15%', '32%', '15%'],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 1 + idx * 0.3, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Anti-Gravity Control Button Component ──────────────────────────────────────
// ── Real-Time Charging Boost Button Component ──────────────────────────────────────
export function AntiGravityButton({ isActive, onToggle, isDisabled }) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.96 } : {}}
      animate={!isDisabled ? {
        boxShadow: isActive ? [
          '0 0 20px #d4d414, 0 0 40px rgba(212,212,20,0.8)',
          '0 0 35px #00f0ff, 0 0 60px rgba(0,240,255,0.8)',
          '0 0 20px #d4d414, 0 0 40px rgba(212,212,20,0.8)',
        ] : [
          '0 0 12px rgba(0,240,255,0.4), 0 0 24px rgba(212,212,20,0.3)',
          '0 0 22px rgba(0,240,255,0.7), 0 0 38px rgba(212,212,20,0.6)',
          '0 0 12px rgba(0,240,255,0.4), 0 0 24px rgba(212,212,20,0.3)',
        ],
      } : {}}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justify: 'center',
        gap: 10,
        padding: '10px 24px',
        borderRadius: 30,
        fontSize: 13,
        fontWeight: 900,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.04em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        background: isActive
          ? 'linear-gradient(135deg, rgba(212, 212, 20, 0.35) 0%, rgba(0, 240, 255, 0.35) 100%)'
          : 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(212, 212, 20, 0.15) 100%)',
        color: isActive ? '#d4d414' : '#ffffff',
        border: `2px solid ${isActive ? '#d4d414' : 'rgba(0, 240, 255, 0.6)'}`,
        backdropFilter: 'blur(8px)',
        textShadow: isActive ? '0 0 10px #d4d414' : 'none',
        transition: 'border 0.3s ease, color 0.3s ease, background 0.3s ease',
      }}
      title={isDisabled ? 'Boost mode is currently disabled' : 'Activate Real-Time High-Voltage Charging Boost'}
    >
      <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px #d4d414)' }}>⚡</span>
      <span>{isActive ? 'DEACTIVATE BOOST' : 'BOOST NOW'}</span>
      {isActive && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#d4d414',
          boxShadow: '0 0 10px #d4d414', display: 'inline-block', marginLeft: 4,
        }} />
      )}
    </motion.button>
  );
}

// ── Real-Time Charging Boost Dashboard Metrics Display Panel ───────────────────────────────
export function AntiGravityMetricsPanel({ isActive, soc, baseRangeKm }) {
  if (!isActive) return null;

  const currentRange = Math.round((soc / 100) * baseRangeKm);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, rgba(212, 212, 20, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(212, 212, 20, 0.5)',
        borderRadius: 14,
        padding: '14px 20px',
        boxShadow: '0 0 25px rgba(212, 212, 20, 0.25)',
        backdropFilter: 'blur(12px)',
        marginTop: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, animation: 'pulse 1.2s infinite' }}>⚡</span>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 14, color: '#d4d414', letterSpacing: '0.02em' }}>
              REAL-TIME ULTRA-FAST CHARGING BOOST ACTIVE
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              800V DC HIGH-VOLTAGE HYPER-CHARGE ENGAGED (+350 kW)
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(212, 212, 20, 0.2)',
          border: '1px solid #d4d414',
          color: '#d4d414',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 800,
          boxShadow: '0 0 12px rgba(212, 212, 20, 0.5)',
        }}>
          BOOSTING CHARGE (+350 kW)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {/* Metric 1: Mode */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(212, 212, 20, 0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            BOOST MODE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#d4d414', marginTop: 2 }}>
            Real-Time Boost Active
          </div>
        </div>

        {/* Metric 2: Charging Rate */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0, 240, 255, 0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            CHARGING RATE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#00f0ff', marginTop: 2 }}>
            350 kW DC Fast
          </div>
        </div>

        {/* Metric 3: Battery Increment */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            BATTERY CHARGE SOC
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#22c55e', marginTop: 2 }}>
            {Math.round(soc)}% <span style={{ fontSize: 10, color: '#22c55e' }}>(+1.5%/sec)</span>
          </div>
        </div>

        {/* Metric 4: Estimated Range */}
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            ESTIMATED RANGE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: '#22c55e', marginTop: 2 }}>
            {currentRange} km <span style={{ fontSize: 10, color: '#22c55e' }}>(+5 km/sec)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Boost Mode Wrapper Component ──────────────────────────────────
export default function AntiGravityMode({ isActive, onToggle, isCharging, soc, baseRangeKm }) {
  // Voice prompts sequence when activating/deactivating
  useEffect(() => {
    if (isActive) {
      speakAntiGravityVoice('Real-time Ultra-Fast Charging Boost activated. 800V DC Hyper-Charge initiated.');
    } else {
      speakAntiGravityVoice('Charging Boost deactivated.');
    }
  }, [isActive]);

  return (
    <div>
      <AntiGravityMetricsPanel isActive={isActive} soc={soc} baseRangeKm={baseRangeKm} />
    </div>
  );
}
