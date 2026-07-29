import { motion } from 'framer-motion';

/**
 * Custom EV Vehicle Loader Component
 * Renders an electric vehicle driving along an illuminated energy track.
 */
export default function EVVehicleLoader({ label = 'Vehicle Loading…', compact = false }) {
  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <motion.div
          animate={{ x: [-4, 6, -4] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <svg width="24" height="16" viewBox="0 0 28 16" fill="none" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>
            <rect x="2" y="4" width="24" height="9" rx="3" fill="#00f0ff" />
            <rect x="7" y="5.5" width="7" height="4" rx="1" fill="#080805" />
            <rect x="16" y="5.5" width="6" height="4" rx="1" fill="#080805" />
            <circle cx="7" cy="13" r="2.5" fill="#080805" stroke="#d4d414" strokeWidth="1.5" />
            <circle cx="21" cy="13" r="2.5" fill="#080805" stroke="#d4d414" strokeWidth="1.5" />
            <circle cx="25" cy="7" r="1.2" fill="#ffffff" />
          </svg>
        </motion.div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#00f0ff' }}>{label}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      {/* Animated Electric Road Track with Car */}
      <div style={{
        position: 'relative', width: '100%', height: 44,
        background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 240, 255, 0.35)',
        borderRadius: 22, overflow: 'hidden', display: 'flex', alignItems: 'center',
        boxShadow: '0 0 16px rgba(0, 240, 255, 0.15)',
      }}>
        {/* Animated road energy stripes */}
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,240,255,0.2) 15px, rgba(0,240,255,0.2) 30px)',
            backgroundSize: '60px 100%',
          }}
          animate={{ backgroundPosition: ['0px 0', '-60px 0'] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />

        {/* Vehicle driving across screen */}
        <motion.div
          style={{
            position: 'absolute', top: 8, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          initial={{ left: '0%' }}
          animate={{ left: ['0%', '82%', '0%'] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          {/* Detailed EV Sports Car */}
          <svg width="44" height="26" viewBox="0 0 44 26" fill="none" style={{ filter: 'drop-shadow(0 0 10px #00f0ff)' }}>
            {/* Car Body */}
            <path d="M4 14C4 10.5 7 7 12 7H30C35 7 38 10 40 14V18H4V14Z" fill="#00f0ff" />
            {/* Roof / Cabin */}
            <path d="M12 7L16 2H28L32 7H12Z" fill="#0d1b2a" stroke="#00f0ff" strokeWidth="1" />
            {/* Headlight Beam Glow */}
            <polygon points="40,12 44,9 44,17" fill="rgba(255,255,255,0.8)" />
            {/* Wheels */}
            <circle cx="11" cy="19" r="4.5" fill="#080805" stroke="#d4d414" strokeWidth="2" />
            <circle cx="31" cy="19" r="4.5" fill="#080805" stroke="#d4d414" strokeWidth="2" />
            {/* Alloy Rims */}
            <circle cx="11" cy="19" r="1.8" fill="#00f0ff" />
            <circle cx="31" cy="19" r="1.8" fill="#00f0ff" />
          </svg>
        </motion.div>
      </div>

      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
    </div>
  );
}
