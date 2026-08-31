import { useState } from 'react';


export default function MyBookingsPanel({ useEVSystemHook, onFindChargerClick }) {
  const {
    userBookings,
    activeBooking,
    cancelBooking,
    startCharging,
    completeCharging,
    bookingLoading,
  } = useEVSystemHook;

  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const previousBookings = (userBookings || []).filter(
    b => ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(b.status)
  );

  async function handleCancel(bookingId, stationId) {
    setActionError('');
    try {
      await cancelBooking(bookingId, stationId);
      setCancellingId(null);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking.');
    }
  }

  async function handleStartCharging(bookingId) {
    setActionError('');
    try {
      await startCharging(bookingId);
    } catch (err) {
      setActionError(err.message || 'Failed to start charging.');
    }
  }

  async function handleCompleteCharging(bookingId) {
    setActionError('');
    try {
      await completeCharging(bookingId);
    } catch (err) {
      setActionError(err.message || 'Failed to complete charging.');
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
          — MY CHARGING RESERVATIONS
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          My Bookings & Queue Status
        </h1>
      </div>

      {actionError && (
        <div style={{
          background: 'rgba(255, 68, 68, 0.12)', border: '1px solid #ff4444',
          color: '#ff6666', padding: '12px 16px', borderRadius: '8px', fontSize: 13, marginBottom: 20
        }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* ── SECTION 1: Active / Upcoming Booking ── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>
          Upcoming & Active Charging
        </h2>

        {activeBooking ? (
          <div className="rydex-card-accent hover-lift" style={{ padding: '28px', background: 'rgba(0, 240, 255, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase',
                  background: activeBooking.status === 'CHARGING' ? '#22c55e' : activeBooking.status === 'WAITING' ? '#eab308' : '#00f0ff',
                  color: '#000'
                }}>
                  {activeBooking.status === 'WAITING' ? 'IN QUEUE' : activeBooking.status}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '10px 0 4px 0', color: '#fff' }}>
                  {activeBooking.stationName}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Booking ID: <strong style={{ color: 'var(--accent)' }}>{activeBooking.bookingId}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>QUEUE POSITION</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
                  #{activeBooking.queuePosition || 1}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                  Est. Wait: <strong>{activeBooking.estimatedWaitTime || 0} min</strong>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
              background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DATE & TIME</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{activeBooking.date}</div>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{activeBooking.startTime}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CHARGER SPECS</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{activeBooking.chargerType}</div>
                <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginTop: 2 }}>⚡ {activeBooking.powerKw} kW</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>RESERVATION DURATION</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{activeBooking.durationMinutes} Minutes</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Auto-assign active</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {activeBooking.status === 'BOOKED' && (
                <button
                  onClick={() => handleStartCharging(activeBooking.bookingId)}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
                >
                  ⚡ Start Charging Now
                </button>
              )}

              {activeBooking.status === 'CHARGING' && (
                <button
                  onClick={() => handleCompleteCharging(activeBooking.bookingId)}
                  style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 800,
                    background: '#22c55e', border: 'none', color: '#000', borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  ✓ Finish Charging & Free Bay
                </button>
              )}

              <button
                onClick={() => setCancellingId(activeBooking.bookingId)}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700,
                  background: 'rgba(255, 51, 68, 0.15)', border: '1px solid #ff3344',
                  color: '#ff6666', borderRadius: 8, cursor: 'pointer'
                }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        ) : (
          <div className="rydex-card" style={{ padding: '36px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              NO UPCOMING CHARGING
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              You have no active slot reservations or waitlist positions.
            </div>
            {onFindChargerClick && (
              <button
                onClick={onFindChargerClick}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700 }}
              >
                Find a Charger & Book Slot
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Previous Bookings History ── */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14, color: '#aaa' }}>
          Booking History
        </h2>

        {previousBookings.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {previousBookings.map((b) => (
              <div
                key={b.bookingId || b.id}
                className="rydex-card"
                style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                      background: b.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 51, 68, 0.2)',
                      color: b.status === 'COMPLETED' ? '#4ade80' : '#ff6666'
                    }}>
                      {b.status}
                    </span>
                    <strong style={{ fontSize: 15, color: '#fff' }}>{b.stationName}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    ID: {b.bookingId} | Date: {b.date} ({b.startTime}) | Power: {b.powerKw} kW
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#888', textAlign: 'right' }}>
                  Duration: {b.durationMinutes} min
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>
            No past completed or cancelled bookings yet.
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancellingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="rydex-card" style={{ padding: 24, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px 0' }}>Cancel Charging Booking?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Your slot will be released and the next vehicle in the queue will be assigned automatically.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleCancel(cancellingId, activeBooking?.stationId)}
                disabled={bookingLoading}
                style={{
                  flex: 1, padding: '10px', background: '#ff3344', border: 'none', color: '#fff',
                  borderRadius: 6, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {bookingLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setCancellingId(null)}
                style={{
                  flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  borderRadius: 6, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
