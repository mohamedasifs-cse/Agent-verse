import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * VehicleHealthAndEstimatorPanel
 * Complete EV Vehicle Check & Service-on-KM Health Monitor
 */
export default function VehicleHealthAndEstimatorPanel({ telemetry, vehicleName = 'TATA Safari EV' }) {
  // Diagnostic System Check State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [lastScanTime, setLastScanTime] = useState(new Date().toLocaleTimeString());

  // Current odometry distance & service metrics
  const totalOdometryKm = telemetry?.totalDistanceKm || 4820;
  const nextServiceIntervalKm = 10000;
  const currentServiceKm = totalOdometryKm % nextServiceIntervalKm;
  const kmUntilNextService = Math.max(100, nextServiceIntervalKm - currentServiceKm);
  const serviceProgressPct = Math.round((currentServiceKm / nextServiceIntervalKm) * 100);

  const soh = telemetry?.soh ?? 96;
  const tempC = telemetry?.temperatureC ?? 26;

  // Hardware Subsystems
  const [subsystems, setSubsystems] = useState([
    { id: 'motor', name: 'Electric Motor & Powertrain', icon: '🏎️', status: 'Optimal', health: 98, detail: 'Dual-Motor AWD Torque Vectoring Operational' },
    { id: 'battery', name: '800V HV Battery Pack & BMS', icon: '🔋', status: 'Healthy', health: soh, detail: `SoH ${soh}% · Cell Voltage 3.84V · Thermal ${tempC}°C` },
    { id: 'inverter', name: 'SiC Inverter & Charging Port', icon: '⚡', status: 'Operational', health: 99, detail: 'Fast DC 150 kW Charging Protocol Ready' },
    { id: 'brakes', name: 'Regen Braking & Hydraulics', icon: '🛑', status: 'Optimal', health: 95, detail: '95% Pad Life · 0.28g Max Regen Recovery' },
    { id: 'tires', name: 'Tire Pressure & Tread Wear', icon: '🛞', status: 'Good', health: 92, detail: 'Front 34 PSI · Rear 35 PSI · 5,200 km to Rotation' },
    { id: 'cooling', name: 'HVAC & Thermal Cooling Loop', icon: '❄️', status: 'Nominal', health: 96, detail: 'Coolant Flow Rate 14 L/min · Pump Nominal' },
  ]);

  const handleRunDiagnosticScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setLastScanTime(new Date().toLocaleTimeString());
        setSubsystems(prev => prev.map(s => ({
          ...s,
          health: Math.min(100, s.health + (Math.random() > 0.5 ? 1 : 0)),
        })));
      }
    }, 250);
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* ── VEHICLE HEALTH & SERVICE-ON-KM MONITOR ── */}
      <div className="rydex-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--success)',
            }}>
              🔧
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                Vehicle Check & Service-on-KM Monitor
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                HARDWARE INSPECTION & SERVICE COUNTER ({vehicleName.toUpperCase()})
              </div>
            </div>
          </div>

          <button
            onClick={handleRunDiagnosticScan}
            disabled={isScanning}
            className="btn-primary"
            style={{
              padding: '8px 14px', fontSize: 11, fontWeight: 800,
              background: isScanning ? 'rgba(0, 240, 255, 0.2)' : 'var(--accent)',
              color: isScanning ? '#00f0ff' : '#080805', borderRadius: 8,
            }}
          >
            {isScanning ? `🔍 SCANNING ${scanProgress}%` : '🔍 RUN SYSTEM CHECK'}
          </button>
        </div>

        {/* Scanning progress bar */}
        {isScanning && (
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: '#00f0ff' }}
              animate={{ width: `${scanProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        {/* Service-on-KM Counter Progress Bar */}
        <div style={{ background: 'rgba(0,0,0,0.35)', padding: 14, borderRadius: 10, border: '1px solid var(--border-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>
              🔧 NEXT SCHEDULED SERVICE ON KILOMETERS
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--success)' }}>
              In {kmUntilNextService} km
            </div>
          </div>

          {/* Meter Bar */}
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              width: `${serviceProgressPct}%`, height: '100%',
              background: serviceProgressPct > 85 ? 'var(--alert-red)' : 'var(--success)',
              borderRadius: 4, transition: 'width 0.5s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Odometry: {totalOdometryKm} km</span>
            <span>Service Interval: 10,000 km</span>
            <span>Last Scan: {lastScanTime}</span>
          </div>
        </div>

        {/* Live Subsystem Inspection Checkers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {subsystems.map(({ id, name, icon, status, health, detail }) => (
            <div
              key={id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.65)', padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--border-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{detail}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--success)',
                  background: 'rgba(34, 197, 94, 0.12)', padding: '2px 8px', borderRadius: 10,
                  display: 'inline-block',
                }}>
                  ✓ {status} ({health}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
