import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MOCK_HELPERS = [
  { id: 'helper-1', owner: 'Rajeswari S.', vehicle: 'TATA Nexon EV Max', distance_m: 450, soc: 88, max_export_kw: 22, cable: 'CCS2 Bidirectional V2V', rating: 4.9, location: '450m East (2 min away)', reward_inr: 250, match_score: 98 },
  { id: 'helper-2', owner: 'Vikram R.', vehicle: 'Hyundai Ioniq 5', distance_m: 850, soc: 92, max_export_kw: 30, cable: 'CCS2 Bidirectional V2V', rating: 4.8, location: '850m North (4 min away)', reward_inr: 250, match_score: 94 },
  { id: 'helper-3', owner: 'Ananya M.', vehicle: 'MG ZS EV', distance_m: 1400, soc: 79, max_export_kw: 15, cable: 'Type 2 V2V Adaptor', rating: 4.7, location: '1.4km West (6 min away)', reward_inr: 250, match_score: 86 },
  { id: 'helper-4', owner: 'Karthik K.', vehicle: 'Mahindra XUV400 EV', distance_m: 2100, soc: 82, max_export_kw: 22, cable: 'CCS2 Bidirectional V2V', rating: 4.9, location: '2.1km South (9 min away)', reward_inr: 250, match_score: 82 },
];

export default function V2VTransferPanel({ telemetry, vehicleName = 'TATA Safari EV' }) {
  const soc = telemetry?.soc ?? 8;
  const isLowBattery = soc <= 12;

  // Workflow steps: 1: Discovery | 2: Matched List | 3: Request Modal | 4: Live Transfer | 5: Receipt
  const [step, setStep] = useState(1);
  const [selectedHelper, setSelectedHelper] = useState(MOCK_HELPERS[0]);
  const [requestSent, setRequestSent] = useState(false);
  const [transferProgressKwh, setTransferProgressKwh] = useState(0);
  const [receiverSoc, setReceiverSoc] = useState(soc);
  const [isTransferring, setIsTransferring] = useState(false);

  // Auto update receiverSoc if telemetry changes
  useEffect(() => {
    if (step === 1) setReceiverSoc(soc);
  }, [soc, step]);

  // Live Power Transfer animation effect (Step 4 -> 5)
  useEffect(() => {
    let interval = null;
    if (step === 4 && isTransferring) {
      interval = setInterval(() => {
        setTransferProgressKwh(prev => {
          if (prev >= 8.0) {
            clearInterval(interval);
            setIsTransferring(false);
            setStep(5); // Go to receipt
            return 8.0;
          }
          return parseFloat((prev + 0.4).toFixed(1));
        });

        setReceiverSoc(prev => Math.min(25, prev + 1));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [step, isTransferring]);

  function handleStartDiscovery() {
    setStep(2);
  }

  function handleSelectHelper(helper) {
    setSelectedHelper(helper);
    setStep(3); // Open Request Modal
  }

  function handleAcceptRequest() {
    setRequestSent(true);
    setTimeout(() => {
      setStep(4); // Start Live Transfer
      setIsTransferring(true);
      setTransferProgressKwh(0);
    }, 1200);
  }

  function handleReset() {
    setStep(1);
    setRequestSent(false);
    setTransferProgressKwh(0);
    setReceiverSoc(soc);
  }

  function handleDownloadReceipt() {
    const receiptText = `
================================================================
           ⚡ VEHICLE-TO-VEHICLE (V2V) CHARGE RECEIPT ⚡
================================================================
Receipt ID       : #V2V-${Math.floor(1000 + Math.random() * 9000)}
Date & Time      : ${new Date().toLocaleString()}
Status           : COMPLETED & VERIFIED BY AI SAFETY AGENT

----------------------------------------------------------------
1. VEHICLE DETAILS
----------------------------------------------------------------
Receiver EV      : ${vehicleName}
Receiver Battery : ${soc}% ➔ ${receiverSoc}% (+35 km Emergency Range)
Helper Owner     : ${selectedHelper?.owner || 'Rajeswari S.'}
Helper Vehicle   : ${selectedHelper?.vehicle || 'TATA Nexon EV Max'}
Helper Location  : ${selectedHelper?.location || '450m East'}

----------------------------------------------------------------
2. ENERGY & TRANSFER METRICS
----------------------------------------------------------------
Energy Delivered : 8.0 kWh
Transfer Rate    : 22.0 kW (CCS2 Bidirectional V2V Cable)
Transfer Duration: 18 minutes
Safety Protocol  : 400V Stable / Thermals 31°C Nominal

----------------------------------------------------------------
3. FINANCIAL & REWARDS BREAKDOWN
----------------------------------------------------------------
Receiver Payment : ₹${selectedHelper?.reward_inr || 250} (Paid via EV Fleet Wallet / UPI)
Helper Earnings  : ₹${selectedHelper?.reward_inr || 250}
Helper Eco Bonus : +50 Eco Cashback Points

================================================================
Thank you for using the AI EV Multi-Agent V2V Charge Transfer System!
Drive Smarter. Ride Greener.
================================================================
`.trim();

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `V2V_Charge_Transfer_Receipt_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
        border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 16, padding: '20px 24px',
        backdropFilter: 'blur(16px)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: isLowBattery ? 'rgba(255,80,80,0.2)' : 'rgba(0,240,255,0.15)',
            border: `1px solid ${isLowBattery ? '#ff5050' : '#00f0ff'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: isLowBattery ? '#ff5050' : '#00f0ff',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00f0ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              EMERGENCY CHARGE SHARE AGENT
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: '#fff' }}>
              Vehicle-to-Vehicle (V2V) Charge Transfer
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Safely transfer energy between nearby EVs during battery emergencies
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>YOUR VEHICLE</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{vehicleName}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: receiverSoc <= 10 ? '#ff5050' : '#22c55e' }}>
              {receiverSoc}% SoC {receiverSoc <= 10 ? '(CRITICAL)' : ''}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: 11, padding: '8px 14px' }}
          >
            🔄 Reset V2V
          </button>
        </div>
      </div>

      {/* ── STEP 1: LOW BATTERY DETECTION & INITIATE ── */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span className="rydex-badge warning" style={{ fontSize: 11 }}>1. Low Battery Detection</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {isLowBattery ? '⚠️ Critical Battery Detected (≤ 10%)' : '🔋 Battery Level Nominal — Emergency V2V Ready'}
              </h3>
            </div>
            <span className={`rydex-badge ${isLowBattery ? 'danger' : 'success'}`} style={{ fontSize: 12 }}>
              {receiverSoc}% Battery SoC
            </span>
          </div>

          <div style={{
            background: isLowBattery ? 'rgba(255,80,80,0.1)' : 'rgba(0,240,255,0.05)',
            border: `1px solid ${isLowBattery ? 'rgba(255,80,80,0.3)' : 'rgba(0,240,255,0.2)'}`,
            borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5,
          }}>
            {isLowBattery ? (
              <>🚨 <strong>Emergency Alert:</strong> Battery level is at <strong>{receiverSoc}%</strong> with no reachable fixed EV charging stations in range. Emergency V2V Mode is active to match nearby helper vehicles for an <strong>8 kWh</strong> boost.</>
            ) : (
              <>⚡ <strong>V2V Standby:</strong> AI continuously monitors your battery. If battery drops to ≤ 10%, Emergency V2V Mode will automatically discover nearby opted-in EVs for emergency power transfer.</>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'rgba(20,25,35,0.7)', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REQUIRED ENERGY</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#00f0ff', marginTop: 2 }}>8.0 kWh (+35 km Range)</div>
            </div>
            <div style={{ background: 'rgba(20,25,35,0.7)', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>HELPER REWARD</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#d4d414', marginTop: 2 }}>₹250 + 50 Eco Cashback</div>
            </div>
            <div style={{ background: 'rgba(20,25,35,0.7)', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>CABLE COMPATIBILITY</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e', marginTop: 2 }}>CCS2 Bidirectional V2V</div>
            </div>
          </div>

          <button
            onClick={handleStartDiscovery}
            className="btn-primary"
            style={{ width: '100%', padding: '14px 24px', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <span>🔍 INITIATE NEARBY EV DISCOVERY (AI MATCHING)</span>
            <span>→</span>
          </button>
        </motion.div>
      )}

      {/* ── STEP 2: NEARBY EV DISCOVERY & AI MATCHING LIST ── */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span className="rydex-badge accent" style={{ fontSize: 11 }}>2. Nearby EV Discovery & AI Matching</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 6 }}>
                Opted-In Nearby Helper Vehicles Matched
              </h3>
            </div>
            <span className="rydex-badge success" style={{ fontSize: 11 }}>{MOCK_HELPERS.length} Helpers Active Nearby</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {MOCK_HELPERS.map((helper, idx) => (
              <div
                key={helper.id}
                onClick={() => handleSelectHelper(helper)}
                style={{
                  background: idx === 0 ? 'rgba(0, 240, 255, 0.08)' : 'rgba(20, 25, 35, 0.75)',
                  border: `1px solid ${idx === 0 ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  transition: 'all 0.2s ease',
                }}
                className="hover-lift"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: idx === 0 ? 'rgba(212, 212, 20, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                    border: `1px solid ${idx === 0 ? '#d4d414' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: idx === 0 ? '#d4d414' : '#fff',
                  }}>
                    {idx === 0 ? '⭐' : '🚗'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                        {helper.owner}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({helper.vehicle})</span>
                      {idx === 0 && (
                        <span className="rydex-badge accent" style={{ fontSize: 9 }}>#1 AI MATCHED HELPER</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      📍 {helper.location} · 🔌 {helper.cable} · ⭐ {helper.rating}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>HELPER BATTERY</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e' }}>{helper.soc}% SoC</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>EST. REWARD</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#d4d414' }}>₹{helper.reward_inr}</div>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '8px 16px' }}>
                    Select & Request →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── STEP 3: CHARGE TRANSFER REQUEST NOTIFICATION MODAL ── */}
      {step === 3 && selectedHelper && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 16, padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="rydex-badge accent" style={{ fontSize: 11 }}>3. V2V Charge Transfer Request</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Request ID: #V2V-8849</span>
          </div>

          {/* Simulated Helper Owner Phone Notification Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20,25,35,0.95) 0%, rgba(10,14,26,0.95) 100%)',
            border: '1px solid rgba(212, 212, 20, 0.4)', borderRadius: 14, padding: '20px 24px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>📲</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#d4d414', letterSpacing: '0.08em' }}>
                  HELPER OWNER NOTIFICATION PREVIEW ({selectedHelper.owner})
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  Emergency V2V Charging Request
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 16 }}>
              Nearby EV (<strong>{vehicleName}</strong>) requires <strong>8.0 kWh</strong> of emergency battery energy.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 10, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>DISTANCE</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#00f0ff' }}>{selectedHelper.distance_m} m (2 min)</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>TRANSFER AMOUNT</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>8.0 kWh @ 22 kW</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED REWARD</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d4d414' }}>₹{selectedHelper.reward_inr} + 50 Eco Points</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleAcceptRequest}
                disabled={requestSent}
                className="btn-primary"
                style={{ flex: 1, padding: '12px 20px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {requestSent ? '⚡ CONNECTING V2V CABLE…' : '✅ ACCEPT & CONNECT V2V CABLE'}
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
                style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700 }}
              >
                DECLINE
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── STEP 4 & 5: LIVE SECURE POWER TRANSFER SIMULATION & SAFETY MONITOR ── */}
      {step === 4 && selectedHelper && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="rydex-badge accent" style={{ fontSize: 11 }}>5. Secure Power Transfer Simulation</span>
            <span className="rydex-badge success" style={{ fontSize: 11 }}>⚡ V2V Cable Active — 22 kW</span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(10,14,26,0.95) 0%, rgba(20,25,35,0.95) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: 14, padding: '24px 28px', marginBottom: 20,
          }}>
            {/* Visual Animated Transfer Beam */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              {/* Helper Vehicle Card */}
              <div style={{ flex: 1, minWidth: 200, background: 'rgba(30,41,59,0.7)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>HELPER EV (DONOR)</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 2 }}>{selectedHelper.owner}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedHelper.vehicle}</div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 900, color: '#22c55e' }}>{selectedHelper.soc}% SoC</div>
              </div>

              {/* Animated Cable Beam */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#00f0ff', letterSpacing: '0.06em' }}>
                  TRANSFERRING {transferProgressKwh} / 8.0 kWh
                </div>
                <div style={{
                  width: 140, height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', position: 'relative', border: '1px solid #00f0ff44',
                }}>
                  <motion.div
                    style={{ height: '100%', background: 'linear-gradient(90deg, #00f0ff, #d4d414)', borderRadius: 4 }}
                    animate={{ width: `${(transferProgressKwh / 8.0) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div style={{ fontSize: 10, color: '#d4d414', fontWeight: 700 }}>⚡ 22 kW CCS2 Bidirectional</div>
              </div>

              {/* Receiver Vehicle Card */}
              <div style={{ flex: 1, minWidth: 200, background: 'rgba(30,41,59,0.7)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(0,240,255,0.3)' }}>
                <div style={{ fontSize: 11, color: '#00f0ff', fontWeight: 700 }}>RECEIVER EV (YOURS)</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 2 }}>{vehicleName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Emergency Boost Target: 25%</div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 900, color: receiverSoc <= 10 ? '#ff5050' : '#22c55e' }}>{receiverSoc}% SoC</div>
              </div>
            </div>

            {/* AI Safety Monitoring Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>CABLE LOCK</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>🔒 LOCKED</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>VOLTAGE STABILITY</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#00f0ff' }}>⚡ 400V STABLE</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>BATTERY TEMP</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>🌡️ 31°C OPTIMAL</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>AI SAFETY MONITOR</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>✅ 100% NOMINAL</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── STEP 6: PAYMENT & REWARDS RECEIPT ── */}
      {step === 5 && selectedHelper && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 16, padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', border: '2px solid #22c55e', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#22c55e' }}>
              ✓
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
              V2V Energy Transfer Complete!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Successfully boosted your battery from {soc}% to {receiverSoc}% SoC (+35 km range).
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div style={{ background: 'rgba(20,25,35,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Helper Vehicle</span>
              <span style={{ fontWeight: 800, color: '#fff' }}>{selectedHelper.owner} ({selectedHelper.vehicle})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Energy Transferred</span>
              <span style={{ fontWeight: 800, color: '#00f0ff' }}>8.0 kWh @ 22 kW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Digital Payment Transferred</span>
              <span style={{ fontWeight: 800, color: '#22c55e' }}>₹{selectedHelper.reward_inr} (UPI / Fleet Wallet)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Helper Rewards Earned</span>
              <span style={{ fontWeight: 800, color: '#d4d414' }}>₹{selectedHelper.reward_inr} + 50 Eco Cashback Points</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleReset}
              className="btn-primary"
              style={{ flex: 1, padding: '12px 20px', fontSize: 13, fontWeight: 800 }}
            >
              ✓ RETURN TO DASHBOARD
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="btn-secondary"
              style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700 }}
            >
              📄 DOWNLOAD RECEIPT
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
