require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRouter = require('./routes/api');
const VehicleBatterySimulator = require('./simulators/batterySimulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Store io and simulators on app for route access
app.set('io', io);
const simulators = new Map();
app.set('simulators', simulators);

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ev_multiagent')
  .then(() => console.log('[DB] MongoDB connected'))
  .catch(err => console.warn('[DB] MongoDB not available, running without persistence:', err.message));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Start a simulator for this client session
  const vehicleId = `vehicle_${socket.id.slice(0, 8)}`;
  const sim = new VehicleBatterySimulator(io, vehicleId, {
    initialSoc: 65 + Math.random() * 30,
    initialSoh: 88 + Math.random() * 10,
    tickMs: 60000,   // 1-minute simulation tick
  });
  sim.start();
  simulators.set(vehicleId, sim);

  socket.emit('simulator:ready', { vehicleId, telemetry: sim.getTelemetry() });

  socket.on('simulator:setMode', ({ mode, params }) => {
    sim.setMode(mode, params || {});
    socket.emit('simulator:modeChanged', { mode });
  });

  socket.on('disconnect', () => {
    sim.stop();
    simulators.delete(vehicleId);
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] EV Multi-Agent OS running on http://localhost:${PORT}`);
});
