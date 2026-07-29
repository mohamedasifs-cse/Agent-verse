const express = require('express');
const router = express.Router();
const { Vehicle, ChargingSession } = require('../models');
const { supervisorAgent } = require('../agents/supervisorAgent');

// ── Vehicle CRUD ──────────────────────────────────────────────────────────────

router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.query.userId || 'demo' });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ userId: 'demo', ...req.body });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Charging Sessions ─────────────────────────────────────────────────────────

router.get('/charging-history/:vehicleId', async (req, res) => {
  try {
    const history = await ChargingSession.find({ vehicleId: req.params.vehicleId })
      .sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/charging-session', async (req, res) => {
  try {
    const session = await ChargingSession.create(req.body);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Agent Orchestration ───────────────────────────────────────────────────────

router.post('/analyze', async (req, res) => {
  try {
    const { telemetry, origin, destination, vehicleId } = req.body;

    // Guard: build a safe telemetry object with defaults if missing/null
    const safeTelemetry = {
      soc: 70,
      soh: 90,
      temperatureC: 25,
      temperatureStatus: 'normal',
      estimatedRangeKm: 300,
      mode: 'idle',
      speedKmh: 0,
      chargingPowerKw: 0,
      totalDistanceKm: 0,
      totalEnergyChargedKwh: 0,
      ...(telemetry || {}),
    };

    const chargingHistory = vehicleId
      ? await ChargingSession.find({ vehicleId }).sort({ timestamp: -1 }).limit(20).catch(() => [])
      : [];

    const io = req.app.get('io');
    const result = await supervisorAgent({ telemetry: safeTelemetry, origin, destination, chargingHistory }, io);
    res.json(result);
  } catch (err) {
    console.error('[API /analyze]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Nearby EV Stations ────────────────────────────────────────────────────────
// Called independently by the frontend map so stations show without running full analysis.
// GET /api/stations?lat=37.77&lon=-122.41&radius=20&max=15

const { fetchNearbyStations } = require('../utils/chargingStationFetcher');

router.get('/stations', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius) || 25;
    const max = parseInt(req.query.max) || 15;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon query params are required' });
    }

    const stations = await fetchNearbyStations(lat, lon, radius, max);
    res.json({ stations, count: stations.length });
  } catch (err) {
    console.error('[API /stations]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Simulator Control ─────────────────────────────────────────────────────────

router.post('/simulator/:vehicleId/mode', (req, res) => {
  const simulators = req.app.get('simulators');
  const sim = simulators?.get(req.params.vehicleId);
  if (!sim) return res.status(404).json({ error: 'Simulator not found' });
  sim.setMode(req.body.mode, req.body.params || {});
  res.json({ success: true, mode: req.body.mode });
});

router.get('/simulator/:vehicleId/telemetry', (req, res) => {
  const simulators = req.app.get('simulators');
  const sim = simulators?.get(req.params.vehicleId);
  if (!sim) return res.status(404).json({ error: 'Simulator not found' });
  res.json(sim.getTelemetry());
});

module.exports = router;
