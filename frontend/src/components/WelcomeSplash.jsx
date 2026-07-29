import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EVVehicleLoader from './EVVehicleLoader';

export default function WelcomeSplash({ vehicleName, onProceed }) {
  const [countdown, setCountdown] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onProceed]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at center, #0b1329 0%, #080805 90%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)',
    }}>
      {/* Dynamic Cyberpunk Grid & Ambient Glows */}
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,240,255,0.18) 0%, rgba(212,212,20,0.08) 45%, transparent 75%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.6,
        pointerEvents: 'none',
      }} />

      {/* Main Single Window Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'rgba(11, 16, 30, 0.92)',
          border: '1px solid rgba(0, 240, 255, 0.45)',
          borderRadius: 24,
          padding: '44px 40px',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(0,240,255,0.2)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Holographic 3D AI Neural Energy Core Header (Replaces car image) */}
        <div style={{
          position: 'relative', width: 130, height: 130, margin: '0 auto 20px auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Outer rotating telemetry compass ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '2px dashed rgba(0, 240, 255, 0.5)',
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
            }}
          />

          {/* Inner counter-rotating gold pulse ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            style={{
              position: 'absolute', inset: 12,
              borderRadius: '50%',
              border: '2.5px solid transparent',
              borderTopColor: '#d4d414',
              borderBottomColor: '#00f0ff',
            }}
          />

          {/* Core Pulsing High-Voltage AI Energy Emblem */}
          <motion.div
            animate={{ scale: [0.94, 1.06, 0.94] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'radial-gradient(circle, #00f0ff 0%, rgba(212,212,20,0.8) 60%, rgba(13,27,42,0.9) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 35px #00f0ff, inset 0 0 15px #ffffff',
              border: '2px solid #ffffff',
              position: 'relative', zIndex: 10,
            }}
          >
            <span style={{ fontSize: 34, filter: 'drop-shadow(0 0 8px #ffffff)' }}>⚡</span>
          </motion.div>

          {/* Orbiting AI Neural Nodes */}
          {[0, 90, 180, 270].map((deg) => (
            <motion.div
              key={deg}
              animate={{ rotate: [deg, deg + 360] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              style={{
                position: 'absolute', width: '100%', height: '100%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00f0ff', boxShadow: '0 0 10px #00f0ff',
                marginTop: -4,
              }} />
            </motion.div>
          ))}
        </div>

        {/* Unique Headline text */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 900,
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          margin: '0 0 14px 0',
          color: '#ffffff',
        }}>
          Drive Smarter. Ride Greener.<br />
          <span style={{
            background: 'linear-gradient(90deg, #00f0ff 0%, #d4d414 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 12px rgba(0,240,255,0.4))',
          }}>
            Welcome back!
          </span>
        </h1>

        {/* Vehicle Info Pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          padding: '8px 22px', borderRadius: 30,
          fontSize: 13, fontWeight: 700,
          color: 'var(--text-secondary)',
          margin: '4px 0 28px 0',
          boxShadow: '0 0 20px rgba(0,240,255,0.1)',
        }}>
          <span>🚗 Connected Vehicle:</span>
          <span style={{ color: '#00f0ff', fontWeight: 800 }}>{vehicleName || 'Porsche Taycan EV'}</span>
          <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 800 }}>✓ PIN Verified</span>
        </div>

        {/* EV Vehicle Drive Loader replacing basic line */}
        <div style={{ marginBottom: 28 }}>
          <EVVehicleLoader label={`Accelerating Telemetry (${countdown}s)…`} />
        </div>

        {/* Fast Proceed Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onProceed}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 15,
            fontWeight: 900,
            justifyContent: 'center',
            background: 'linear-gradient(90deg, #00f0ff 0%, #d4d414 100%)',
            color: '#080805',
            border: 'none',
            borderRadius: 12,
            boxShadow: '0 6px 25px rgba(0,240,255,0.4)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          PROCEED TO DASHBOARD NOW →
        </motion.button>
      </motion.div>
    </div>
  );
}
