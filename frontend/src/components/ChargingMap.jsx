import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import EVVehicleLoader from './EVVehicleLoader';
import { generateRouteStations, calculateNextRestStop } from '../utils/routeStationCalculator';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Icon factories ─────────────────────────────────────────────────────────────

function createVehicleIcon(heading = 0, isDriving = false) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <!-- Pulsing motion ring when driving -->
        ${isDriving ? `
          <div style="position:absolute;width:42px;height:42px;border-radius:50%;background:rgba(0,240,255,0.18);border:1.5px dashed #00f0ff;animation:pulse-ring 1.5s ease-out infinite;"></div>
        ` : `
          <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.3);"></div>
        `}
        <!-- Car / Arrow container rotated by heading -->
        <div style="transform:rotate(${heading}deg);transition:transform 0.3s ease;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="filter:drop-shadow(0 0 8px #00f0ff);">
            <!-- Direction Arrow Shield -->
            <path d="M16 3L26 24L16 19L6 24L16 3Z" fill="#0d1527" stroke="#00f0ff" stroke-width="2.5" stroke-linejoin="round"/>
            <!-- Inner Car Body -->
            <rect x="11.5" y="8" width="9" height="12" rx="2.5" fill="#00f0ff" />
            <!-- Windshield -->
            <rect x="12.5" y="9.5" width="7" height="3.5" rx="1" fill="#06101e" />
            <rect x="12.5" y="15" width="7" height="3.5" rx="1" fill="#06101e" />
            <!-- Headlights -->
            <circle cx="12" cy="5.5" r="1.5" fill="#ffffff"/>
            <circle cx="20" cy="5.5" r="1.5" fill="#ffffff"/>
          </svg>
        </div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform:scale(0.7); opacity:1; }
          100% { transform:scale(1.4); opacity:0; }
        }
      </style>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createDestIcon() {
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;position:relative;">
        <div style="
          width:30px;height:30px;background:#ff3344;
          border:2.5px solid #fff;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);box-shadow:0 0 14px #ff3344;
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="transform:rotate(45deg);font-size:12px;color:white;font-weight:900;">🏁</div>
        </div>
      </div>`,
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

function createStationIcon(available, isGreen, isBestOnRoute = false) {
  const color = isBestOnRoute ? '#d4d414'
    : available > 0 ? (isGreen ? '#22c55e' : '#60a5fa')
    : '#ff5050';
  const size = isBestOnRoute ? 22 : 16;
  const glow = isBestOnRoute ? `0 0 12px ${color}, 0 0 24px ${color}44` : `0 0 6px ${color}`;
  const label = isBestOnRoute ? `<div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:700;color:${color};white-space:nowrap;background:#111;padding:1px 5px;border-radius:3px;border:1px solid ${color}44;">BEST STOP</div>` : '';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        ${label}
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2px solid white;
          box-shadow:${glow};
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="font-size:${size * 0.55}px;line-height:1;">⚡</span>
        </div>
      </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Map auto-fit to route ──────────────────────────────────────────────────────
function MapBoundsUpdater({ routePoints, vehicleLat, vehicleLon, destLat, destLon }) {
  const map = useMap();
  useEffect(() => {
    if (routePoints && routePoints.length > 1) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [48, 48] });
    } else if (destLat && destLon) {
      const bounds = L.latLngBounds(
        [vehicleLat, vehicleLon],
        [destLat, destLon]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePoints, destLat, destLon]);
  return null;
}

// ── OSRM route fetcher ────────────────────────────────────────────────────────
async function fetchOSRMRoute(originLat, originLon, destLat, destLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM fetch failed');
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  const coords = data.routes[0].geometry.coordinates; // [lon, lat] pairs
  return {
    points: coords.map(([lon, lat]) => [lat, lon]),
    distanceM: data.routes[0].distance,
    durationS: data.routes[0].duration,
  };
}

// ── Route info overlay ─────────────────────────────────────────────────────────
function RouteInfoBar({ distanceM, durationS, stopsCount }) {
  if (!distanceM) return null;
  const km = (distanceM / 1000).toFixed(1);
  const mins = Math.round(durationS / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const timeLabel = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`;

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, display: 'flex', gap: 10, alignItems: 'center',
      background: 'rgba(8,8,5,0.92)', border: '1px solid var(--border-strong)',
      borderRadius: 24, padding: '8px 20px', backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>
        {km} km
      </span>
      <span style={{ color: 'var(--border-strong)' }}>·</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{timeLabel}</span>
      {stopsCount > 0 && (
        <>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>⚡ {stopsCount} charger{stopsCount !== 1 ? 's' : ''} on route</span>
        </>
      )}
    </div>
  );
}

/**
 * ChargingMap — Rydex-styled map with:
 *  • OSRM-powered optimized route polyline (like Google Maps)
 *  • Auto-fits bounds to show full route
 *  • EV charging stations shown as styled ⚡ icons
 *  • "Best stop" highlighting for on-route chargers
 *  • Route info bar (distance, ETA, charger count)
 */
export default function ChargingMap({
  vehicleLat = 37.7749, vehicleLon = -122.4194,
  destLat, destLon,
  stations = [],
  emergencyRadius = null,
  heading = 0,
  isDriving = false,
  onToggleDrive = null,
  soc = 80,
  onRouteLoaded = null,
  vehicleType = 'car',
  maxRange = 400,
  traveledKm = 0,
}) {
  const center = [vehicleLat, vehicleLon];
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const prevDestRef = useRef(null);

  // Fetch OSRM route whenever destination changes
  useEffect(() => {
    if (!destLat || !destLon) {
      setRoutePoints(null);
      setRouteInfo(null);
      if (onRouteLoaded) onRouteLoaded(null);
      return;
    }
    const key = `${destLat},${destLon}`;
    if (prevDestRef.current === key) return;
    prevDestRef.current = key;

    setLoadingRoute(true);
    fetchOSRMRoute(vehicleLat, vehicleLon, destLat, destLon)
      .then(({ points, distanceM, durationS }) => {
        setRoutePoints(points);
        setRouteInfo({ distanceM, durationS });
        if (onRouteLoaded) {
          onRouteLoaded({ points, distanceM, durationS });
        }
      })
      .catch(err => {
        console.warn('Route fetch error:', err.message);
        // Fallback: straight line
        const fallback = [[vehicleLat, vehicleLon], [destLat, destLon]];
        setRoutePoints(fallback);
        if (onRouteLoaded) {
          onRouteLoaded({ points: fallback, distanceM: 0, durationS: 0 });
        }
      })
      .finally(() => setLoadingRoute(false));
  }, [destLat, destLon, vehicleLat, vehicleLon, onRouteLoaded]);

  // Generate charging stations along the entire route tailored for Car vs Scooter
  const { allRouteStations, totalTripKm } = useMemo(() => {
    if (routePoints && routePoints.length > 1) {
      const { allStations, totalTripDistanceKm } = generateRouteStations(
        routePoints,
        { lat: vehicleLat, lon: vehicleLon },
        { lat: destLat, lon: destLon },
        stations,
        vehicleType,
        maxRange
      );
      return { allRouteStations: allStations, totalTripKm: totalTripDistanceKm };
    }
    return { allRouteStations: stations, totalTripKm: 0 };
  }, [routePoints, vehicleLat, vehicleLon, destLat, destLon, stations, vehicleType, maxRange]);

  // Calculate battery range thresholds & optimal next rest stop before vehicle moves & dynamically as it travels
  const restStopPlan = useMemo(() => {
    if (allRouteStations && allRouteStations.length > 0 && totalTripKm > 0) {
      return calculateNextRestStop(allRouteStations, totalTripKm, soc, vehicleType, maxRange, traveledKm);
    }
    return null;
  }, [allRouteStations, totalTripKm, soc, vehicleType, maxRange, traveledKm]);

  // Stations located along route
  const stationsOnRoute = allRouteStations;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

      {/* Map Canvas Container (isolated stacking context so Leaflet never overlaps sticky header) */}
      <div style={{ width: '100%', height: 480, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', isolation: 'isolate', zIndex: 1 }}>



        {/* Vehicle loading overlay */}
        {loadingRoute && (
          <div style={{
            position: 'absolute', top: 16, right: 16, zIndex: 1001,
            background: 'rgba(8,12,24,0.94)', border: '1px solid rgba(0,240,255,0.4)',
            borderRadius: 20, padding: '6px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}>
            <EVVehicleLoader label="Navigating Route…" compact={true} />
          </div>
        )}

        {/* Route info bar positioned slightly higher */}
        {routeInfo && (
          <RouteInfoBar
            distanceM={routeInfo.distanceM}
            durationS={routeInfo.durationS}
            stopsCount={stationsOnRoute.length}
          />
        )}

        <MapContainer
          center={center}
          zoom={destLat ? 10 : 13}
          style={{ height: '100%', width: '100%', background: '#080805' }}
          zoomControl={true}
        >
          {/* Dark map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          <MapBoundsUpdater
            routePoints={routePoints}
            vehicleLat={vehicleLat}
            vehicleLon={vehicleLon}
            destLat={destLat}
            destLon={destLon}
          />

          {/* ── Route polyline (Google Maps style) ── */}
          {routePoints && routePoints.length > 1 && (
            <>
              {/* Shadow / outline */}
              <Polyline
                positions={routePoints}
                pathOptions={{ color: '#000', weight: 8, opacity: 0.4 }}
              />
              {/* Main route line */}
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: '#4285f4',    // Google Maps-style blue
                  weight: 5,
                  opacity: 0.92,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Accent highlight */}
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: '#00f0ff',
                  weight: 2,
                  opacity: 0.6,
                  dashArray: '1 8',
                }}
              />
            </>
          )}

          {/* ── Vehicle position (rotatable EV Car Icon) ── */}
          <Marker position={center} icon={createVehicleIcon(heading, isDriving)}>
            <Popup>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>
                🚗 Your EV {isDriving ? '(Driving)' : '(Parked)'}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                {vehicleLat.toFixed(4)}, {vehicleLon.toFixed(4)}
              </div>
              {heading !== undefined && (
                <div style={{ fontSize: 10, color: '#00aaff', marginTop: 2, fontWeight: 600 }}>
                  Heading: {Math.round(heading)}°
                </div>
              )}
            </Popup>
          </Marker>

          {/* ── Destination ── */}
          {destLat && destLon && (
            <Marker position={[destLat, destLon]} icon={createDestIcon()}>
              <Popup>
                <div style={{ fontWeight: 700, fontSize: 13 }}>🏁 Destination</div>
                {routeInfo && (
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    {(routeInfo.distanceM / 1000).toFixed(1)} km · {Math.round(routeInfo.durationS / 60)} min
                  </div>
                )}
              </Popup>
            </Marker>
          )}

          {/* ── Emergency radius ── */}
          {emergencyRadius && (
            <Circle
              center={center}
              radius={emergencyRadius * 1000}
              pathOptions={{ color: '#ff5050', fillColor: '#ff5050', fillOpacity: 0.05, dashArray: '6 6' }}
            />
          )}

          {/* ── EV Charging stations along full route ── */}
          {allRouteStations.map(station => {
            const isBestStop = restStopPlan?.bestStop?.id === station.id;
            return (
              <Marker
                key={station.id}
                position={[station.lat, station.lon]}
                icon={createStationIcon(station.available_bays, station.is_green, isBestStop)}
              >
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{station.name}</div>
                    {station.address && (
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{station.address}</div>
                    )}
                    {isBestStop ? (
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#080805', background: '#d4d414', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 6 }}>
                        ⭐ RECOMMENDED NEXT REST & CHARGE STOP
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#00f0ff', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 6 }}>
                        ⚡ Highway Charger @ Km {station.distanceFromOriginKm || Math.round(station.distance_km)}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12, marginTop: 4 }}>
                      <div style={{ color: station.available_bays > 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {station.available_bays}/{station.total_bays} bays free
                      </div>
                      <div style={{ fontWeight: 700 }}>⚡ {station.max_power_kw} kW</div>
                      <div>💰 ₹{station.price_per_kwh}/kWh</div>
                      <div>📍 Km {station.distanceFromOriginKm || Math.round(station.distance_km)}</div>
                      {station.amenities && (
                        <div style={{ gridColumn: 'span 2', fontSize: 11, color: '#2563eb', marginTop: 4 }}>
                          {station.amenities.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        {!restStopPlan && (
          <div style={{
            position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
            background: 'rgba(8,8,5,0.88)', border: '1px solid var(--border-muted)',
            borderRadius: 8, padding: '8px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }}>
            {[
              { dot: '#00f0ff', label: 'Your EV (Car)' },
              { dot: '#4285f4', label: 'Route' },
              { dot: '#ff3344', label: 'Destination' },
              { dot: '#d4d414', label: 'Best charger' },
              { dot: '#22c55e', label: 'Green charger' },
              { dot: '#60a5fa', label: 'Charger' },
            ].map(({ dot, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}` }} />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Trip Charging Strategy & Next Rest Stop Plan Panel (separated by 24px gap with 24px padding) ── */}
      {restStopPlan && restStopPlan.bestStop && (
        <div style={{
          background: 'rgba(10, 14, 26, 0.94)', border: '1px solid rgba(0, 240, 255, 0.45)',
          borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 35px rgba(0,0,0,0.85), 0 0 25px rgba(0,240,255,0.15)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(212, 212, 20, 0.2)', border: '1px solid #d4d414',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#d4d414',
              }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#d4d414', letterSpacing: '0.08em' }}>
                  OPTIMAL NEXT REST & CHARGE STOP
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                  {restStopPlan.bestStop.name}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="rydex-badge accent" style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px' }}>
                ⚡ {restStopPlan.bestStop.max_power_kw} kW DC Fast
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {restStopPlan.bestStop.available_bays} / {restStopPlan.bestStop.total_bays} Bays Available
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: 'rgba(15, 23, 42, 0.65)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>BATTERY ON ARRIVAL</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: restStopPlan.socOnArrival < 15 ? '#ff5050' : '#22c55e', marginTop: 2 }}>
                {restStopPlan.socOnArrival}% SoC
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>STOP LOCATION</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#00f0ff', marginTop: 2 }}>
                Km {restStopPlan.bestStop.distanceFromOriginKm || 240}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>CHARGE DURATION</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#d4d414', marginTop: 2 }}>
                {restStopPlan.chargeTimeMins} mins
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>REST AMENITIES</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {restStopPlan.bestStop.amenities?.join(' · ') || '☕ Restroom & Coffee'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

