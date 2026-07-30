import { useState } from 'react';
import { motion } from 'framer-motion';
import EVVehicleLoader from './EVVehicleLoader';

const PRESET_VEHICLES = [
  'Porsche Taycan EV',
  'TATA Safari EV',
];

export default function VehicleLogin({ onLogin }) {
  const [vehicleName, setVehicleName] = useState('Porsche Taycan EV');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!vehicleName.trim()) {
      setError('Please enter your vehicle name.');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-digit PIN (e.g. 1234).');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        vehicleName: vehicleName.trim(),
        pin,
        loginTime: new Date().toISOString(),
      });
    }, 150);
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#080805',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)',
    }}>
      {/* Background ambient glowing spotlights */}
      <div style={{
        position: 'absolute', top: '-10%', left: '30%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,212,20,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '20%', width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(17, 17, 16, 0.92)',
          border: '1px solid rgba(212, 212, 20, 0.35)',
          borderRadius: 20,
          padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,212,20,0.1)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Top Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent)',
            borderRadius: 14,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: '#080805', fontWeight: 900,
            boxShadow: '0 0 24px rgba(212,212,20,0.5)',
            marginBottom: 14,
          }}>
            ⚡
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.02em', margin: '0 0 6px 0',
          }}>
            EV Multi-Agent OS
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Connect your EV vehicle to start AI fleet management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Vehicle Name Field */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: 8,
            }}>
              🚗 Vehicle Name
            </label>
            <input
              type="text"
              value={vehicleName}
              onChange={e => setVehicleName(e.target.value)}
              placeholder="e.g. Porsche Taycan EV"
              className="rydex-input"
              style={{
                fontSize: 14, padding: '12px 16px',
                background: 'rgba(30,30,27,0.8)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
              }}
            />

            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {PRESET_VEHICLES.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setVehicleName(preset)}
                  style={{
                    fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                    background: vehicleName === preset ? 'rgba(212,212,20,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${vehicleName === preset ? 'var(--accent)' : 'var(--border-muted)'}`,
                    color: vehicleName === preset ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle PIN Field */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: 8,
            }}>
              🔑 Security PIN
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN (e.g. 1234)"
              className="rydex-input"
              style={{
                fontSize: 16, padding: '12px 16px', letterSpacing: '0.2em',
                background: 'rgba(30,30,27,0.8)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              💡 Demo PIN: Any 4 digits (e.g. <strong style={{ color: 'var(--accent)' }}>1234</strong>)
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.4)',
              color: '#ff5050', fontSize: 12, fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 800,
              justifyContent: 'center',
              background: 'var(--accent)',
              color: '#080805',
              border: 'none',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(212,212,20,0.4)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: 6,
            }}
          >
            {isLoading ? <EVVehicleLoader label="Connecting…" compact={true} /> : 'CONNECT VEHICLE →'}
          </motion.button>

        </form>

        {/* Footer info */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          EV Multi-Agent Operating System v2.0 · Encrypted Telemetry Link
        </div>
      </motion.div>
    </div>
  );
}
