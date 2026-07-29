const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  make: String,
  model: String,
  year: Number,
  batteryCapacityKwh: { type: Number, default: 75 },
  maxRangeKm: { type: Number, default: 500 },
  lat: { type: Number, default: 37.7749 },
  lon: { type: Number, default: -122.4194 },
  createdAt: { type: Date, default: Date.now },
});

const chargingSessionSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  stationName: String,
  stationId: Number,
  energyKwh: Number,
  cost: Number,
  durationMinutes: Number,
  startSoc: Number,
  endSoc: Number,
  timestamp: { type: Date, default: Date.now },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const ChargingSession = mongoose.model('ChargingSession', chargingSessionSchema);

module.exports = { Vehicle, ChargingSession };
