import { motion } from 'framer-motion';

export default function WelcomeBanner({ vehicleName, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        margin: '16px 32px 0',
        padding: '16px 24px',
        background: 'linear-gradient(90deg, rgba(17,17,16,0.95) 0%, rgba(26,26,20,0.95) 100%)',
        border: '1px solid var(--accent-border)',
        borderRadius: 14,
        boxShadow: '0 8px 30px rgba(212,212,20,0.15)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Accent glow bar on the left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
        background: 'linear-gradient(to bottom, #d4d414, #00f0ff)',
      }} />

      {/* Main Message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(212,212,20,0.15)', border: '1px solid rgba(212,212,20,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'var(--accent)', flexShrink: 0,
          boxShadow: '0 0 16px rgba(212,212,20,0.3)',
        }}>
          🌿
        </div>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem', fontWeight: 800,
            color: 'var(--text-primary)', margin: 0, lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            Drive Smarter. Ride Greener. <span style={{ color: 'var(--accent)' }}>Welcome back!</span>
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Authenticated Vehicle: <strong style={{ color: '#00f0ff' }}>{vehicleName || 'Porsche Taycan EV'}</strong></span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span className="rydex-badge success" style={{ padding: '2px 8px', fontSize: 10 }}>PIN Verified</span>
          </div>
        </div>
      </div>

      {/* Close button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 18,
            cursor: 'pointer', padding: 8, borderRadius: '50%',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          title="Dismiss banner"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}
