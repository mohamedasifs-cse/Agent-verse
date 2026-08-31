import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';


export default function StationBookingModal({
  station,
  isOpen,
  onClose,
  useEVSystemHook
}) {
  const {
    stationSlots,
    fetchStationSlots,
    bookSlot,
    joinQueue,
    cancelBooking,
    bookingLoading,
    bookingError,
    activeBooking,
  } = useEVSystemHook;

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'slots' | 'confirm' | 'success'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentBookingResult, setCurrentBookingResult] = useState(null);
  const [localError, setLocalError] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const stationId = station?.id || station?.stationId;

  useEffect(() => {
    if (isOpen && stationId) {
      setLocalError('');
      setSelectedSlot(null);
      fetchStationSlots(stationId).catch(() => {});
    }
  }, [isOpen, stationId, fetchStationSlots]);

  if (!isOpen || !station) return null;

  const distKm = station.distance_km || station.distanceKm || 4.2;
  const powerKw = station.max_power_kw || station.maxPowerKw || 150;
  const totalBays = stationSlots?.totalChargers || station.total_bays || station.totalBays || 6;
  const availableBays = stationSlots?.availableChargers ?? (station.available_bays || station.availableBays || 4);
  const occupiedBays = totalBays - availableBays;
  const queueCount = stationSlots?.currentQueueCount ?? (station.queue_length || 0);
  const estWait = stationSlots?.estimatedWaitTimeMinutes ?? (queueCount * 15);

  const isStationActiveUserBooking = activeBooking && String(activeBooking.stationId) === String(stationId);

  async function handleBookClick(slot) {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedSlot(slot);
    setLocalError('');
    setActiveTab('confirm');
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) return;
    setLocalError('');
    try {
      const res = await bookSlot({
        stationId,
        stationName: station.name || 'EV Fast Charger Station',
        startTime: selectedSlot.startTime,
        date: new Date().toISOString().split('T')[0],
        chargerId: selectedSlot.chargerId || 'charger-1',
        chargerType: 'DC Fast Charger',
        powerKw: powerKw,
        durationMinutes: 30
      });
      setCurrentBookingResult(res);
      setActiveTab('success');
    } catch (err) {
      setLocalError(err.message || 'Slot booking failed. Slot may no longer be available.');
    }
  }

  async function handleJoinQueueClick() {
    setLocalError('');
    try {
      const res = await joinQueue({
        stationId,
        stationName: station.name || 'EV Fast Charger Station',
        chargerType: 'DC Fast Charger',
        powerKw: powerKw
      });
      setCurrentBookingResult(res);
      setActiveTab('success');
    } catch (err) {
      setLocalError(err.message || 'Could not join queue.');
    }
  }

  async function handleCancelBookingClick() {
    if (!activeBooking) return;
    try {
      await cancelBooking(activeBooking.bookingId, stationId);
      setShowCancelPrompt(false);
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Could not cancel booking.');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="rydex-card"
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
          padding: '28px', background: '#0b111e', border: '1px solid var(--border-glow)',
          borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,240,255,0.15)', color: '#fff'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
              CHARGE STATION
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              {station.name}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              📍 {station.address || `Location (${distKm} km away)`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', color: '#aaa',
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Global Error Banner */}
        {(localError || bookingError) && (
          <div style={{
            background: 'rgba(255, 68, 68, 0.12)', border: '1px solid #ff4444',
            color: '#ff6666', padding: '12px 16px', borderRadius: '8px', fontSize: 13, marginBottom: 16
          }}>
            ⚠️ {localError || bookingError}
          </div>
        )}

        {/* Active User Booking Banner for this Station */}
        {isStationActiveUserBooking && activeTab === 'details' && (
          <div style={{
            background: 'rgba(0, 240, 255, 0.08)', border: '1px solid var(--accent)',
            borderRadius: '12px', padding: '16px', marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                  background: activeBooking.status === 'WAITING' ? '#eab308' : '#22c55e', color: '#000', textTransform: 'uppercase'
                }}>
                  {activeBooking.status === 'WAITING' ? 'IN QUEUE' : activeBooking.status}
                </span>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: '#fff' }}>
                  Booking ID: {activeBooking.bookingId}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Time: {activeBooking.startTime} | Queue Position: #{activeBooking.queuePosition}
                </div>
              </div>
              <button
                onClick={() => setShowCancelPrompt(true)}
                style={{
                  background: 'rgba(255, 51, 68, 0.2)', border: '1px solid #ff3344',
                  color: '#ff6666', padding: '8px 14px', borderRadius: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 1: Station Details */}
        {activeTab === 'details' && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CHARGER TYPE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#00f0ff', marginTop: 4 }}>DC Fast Charging</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>⚡ {powerKw} kW Power</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABILITY</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: availableBays > 0 ? '#22c55e' : '#ff4444', marginTop: 4 }}>
                  {availableBays} / {totalBays} Available
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{occupiedBays} Occupied</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT QUEUE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: queueCount > 0 ? '#eab308' : '#22c55e', marginTop: 4 }}>
                  {queueCount} Vehicles
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Waiting in line</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED WAIT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  ⏱️ {estWait} minutes
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Average turn time</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => setActiveTab('slots')}
                className="btn-primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 700 }}
              >
                View Available Slots
              </button>

              <button
                onClick={handleJoinQueueClick}
                disabled={bookingLoading}
                style={{
                  width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 700,
                  background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308',
                  color: '#fde047', borderRadius: '8px', cursor: bookingLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {bookingLoading ? 'Joining...' : 'Join Queue'}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: Available Slots */}
        {activeTab === 'slots' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                TODAY — AVAILABLE TIME SLOTS
              </div>
              <button
                onClick={() => setActiveTab('details')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
              >
                ← Back to Details
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
              maxHeight: '340px', overflowY: 'auto', paddingRight: 4, marginBottom: 20
            }}>
              {(stationSlots?.slots || []).map((slot) => {
                const isAvailable = slot.status === 'AVAILABLE';
                return (
                  <div
                    key={slot.slotId || slot.startTime}
                    style={{
                      background: isAvailable ? 'rgba(0, 240, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                      border: isAvailable ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isAvailable ? '#fff' : '#777' }}>
                        {slot.startTime}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block',
                        background: isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        color: isAvailable ? '#4ade80' : '#888'
                      }}>
                        {slot.status}
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => handleBookClick(slot)}
                        style={{
                          background: 'var(--accent)', border: 'none', color: '#000',
                          padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        BOOK
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Occupied</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 3: Booking Confirmation */}
        {activeTab === 'confirm' && selectedSlot && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
              CONFIRM CHARGING BOOKING
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>STATION</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>{station.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DATE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TIME SLOT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{selectedSlot.startTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CHARGER TYPE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>DC Fast Charger</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>POWER</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginTop: 2 }}>{powerKw} kW</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATED DURATION</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>30 minutes</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 800 }}
              >
                {bookingLoading ? 'Reserving...' : 'Confirm Booking'}
              </button>
              <button
                onClick={() => setActiveTab('slots')}
                style={{
                  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', borderRadius: 8, cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: Booking Success / Queue Joined Confirmation */}
        {activeTab === 'success' && currentBookingResult && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {currentBookingResult.status === 'WAITING' ? 'ADDED TO QUEUE' : 'BOOKING CREATED SUCCESSFULLY'}
            </div>

            <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent)', borderRadius: 12, padding: 20, margin: '20px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BOOKING ID</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{currentBookingResult.bookingId}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, height: 'fit-content',
                  background: currentBookingResult.status === 'WAITING' ? '#eab308' : '#22c55e', color: '#000'
                }}>
                  {currentBookingResult.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Station:</span> {currentBookingResult.stationName}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> {currentBookingResult.startTime}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Queue Position:</span> <strong>#{currentBookingResult.queuePosition}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Est. Wait:</span> <strong>{currentBookingResult.estimatedWaitTime} min</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 800 }}
              >
                Close & View Booking
              </button>
              <button
                onClick={() => setShowCancelPrompt(true)}
                style={{
                  padding: '12px 18px', background: 'rgba(255, 51, 68, 0.15)',
                  border: '1px solid #ff3344', color: '#ff6666', borderRadius: 8, cursor: 'pointer', fontWeight: 700
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        )}

        {/* Cancel Booking Prompt Modal */}
        {showCancelPrompt && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(11, 17, 30, 0.95)',
            padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0', color: '#fff' }}>
              Cancel Charging Booking?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360, marginBottom: 20 }}>
              Your slot will be released and the next vehicle in the queue will automatically move forward.
            </p>
            <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
              <button
                onClick={handleCancelBookingClick}
                disabled={bookingLoading}
                style={{
                  flex: 1, padding: '12px', background: '#ff3344', border: 'none',
                  color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer'
                }}
              >
                {bookingLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
              <button
                onClick={() => setShowCancelPrompt(false)}
                style={{
                  flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
