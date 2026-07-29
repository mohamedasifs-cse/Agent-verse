/**
 * VehicleBatterySimulator
 * Physics-based EV battery simulation running on a tick interval.
 * Broadcasts real-time telemetry via Socket.io.
 */
class VehicleBatterySimulator {
  constructor(io, vehicleId, options = {}) {
    this.io = io;
    this.vehicleId = vehicleId;

    // Battery specs
    this.capacityKwh = options.capacityKwh ?? 75;       // e.g. Tesla Model 3 LR
    this.maxRangeKm = options.maxRangeKm ?? 500;

    // State
    this.soc = options.initialSoc ?? 80;                // State of Charge %
    this.soh = options.initialSoh ?? 95;                // State of Health %
    this.temperatureC = options.initialTemp ?? 25;
    this.speedKmh = 0;
    this.mode = 'idle';                                 // idle | driving | charging
    this.chargingPowerKw = 0;
    this.totalEnergyCharged = 0;                        // kWh lifetime
    this.totalDistanceKm = 0;

    this.tickMs = options.tickMs ?? 60000;              // simulation tick — 1 minute
    this._interval = null;
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => this._tick(), this.tickMs);
    console.log(`[Simulator] Vehicle ${this.vehicleId} started`);
  }

  stop() {
    clearInterval(this._interval);
    this._interval = null;
  }

  setMode(mode, params = {}) {
    this.mode = mode;
    if (mode === 'driving') {
      this.speedKmh = params.speedKmh ?? 80;
      this.chargingPowerKw = 0;
    } else if (mode === 'charging') {
      this.speedKmh = 0;
      this.chargingPowerKw = params.powerKw ?? 50;
    } else {
      this.speedKmh = 0;
      this.chargingPowerKw = 0;
    }
  }

  _tick() {
    const tickHours = this.tickMs / 3600000;

    if (this.mode === 'driving') {
      // Energy consumption: base 15 kWh/100km + speed penalty
      const consumptionKwhPer100 = 15 + (this.speedKmh - 60) * 0.08;
      const distanceTick = (this.speedKmh * tickHours);
      const energyUsedKwh = (consumptionKwhPer100 / 100) * distanceTick;
      const socDrop = (energyUsedKwh / (this.capacityKwh * (this.soh / 100))) * 100;

      this.soc = Math.max(0, this.soc - socDrop);
      this.totalDistanceKm += distanceTick;

      // Temperature rises with speed
      const targetTemp = 25 + (this.speedKmh / 120) * 20;
      this.temperatureC += (targetTemp - this.temperatureC) * 0.1;

      // SOH degrades very slowly with usage
      this.soh = Math.max(70, this.soh - 0.0001);

    } else if (this.mode === 'charging') {
      // Charging: CC-CV curve — slows above 80% SOC
      const efficiency = this.soc < 80 ? 0.92 : 0.85;
      const effectivePower = this.chargingPowerKw * efficiency;
      const socGain = (effectivePower * tickHours / (this.capacityKwh * (this.soh / 100))) * 100;

      this.soc = Math.min(100, this.soc + socGain);
      this.totalEnergyCharged += effectivePower * tickHours;

      // Temperature rises during fast charging
      const targetTemp = 25 + (this.chargingPowerKw / 150) * 25;
      this.temperatureC += (targetTemp - this.temperatureC) * 0.15;

      if (this.soc >= 100) this.setMode('idle');

    } else {
      // Idle vampire drain: ~1% per day = ~0.0417% per hour
      const vampireDrain = 0.0417 * tickHours;
      this.soc = Math.max(0, this.soc - vampireDrain);

      // Cool down toward ambient
      this.temperatureC += (22 - this.temperatureC) * 0.05;
    }

    this.temperatureC = +this.temperatureC.toFixed(1);
    this.soc = +this.soc.toFixed(2);
    this.soh = +this.soh.toFixed(2);

    const telemetry = this.getTelemetry();
    this.io.emit(`telemetry:${this.vehicleId}`, telemetry);
    this.io.emit('telemetry:latest', { vehicleId: this.vehicleId, ...telemetry });
  }

  getTelemetry() {
    const estimatedRangeKm = +(this.maxRangeKm * (this.soc / 100) * (this.soh / 100)).toFixed(1);
    const tempStatus = this.temperatureC > 45 ? 'critical'
                     : this.temperatureC > 35 ? 'warm'
                     : this.temperatureC < 5  ? 'cold'
                     : 'normal';
    return {
      vehicleId: this.vehicleId,
      soc: this.soc,
      soh: this.soh,
      temperatureC: this.temperatureC,
      temperatureStatus: tempStatus,
      estimatedRangeKm,
      speedKmh: this.speedKmh,
      mode: this.mode,
      chargingPowerKw: this.chargingPowerKw,
      totalDistanceKm: +this.totalDistanceKm.toFixed(1),
      totalEnergyChargedKwh: +this.totalEnergyCharged.toFixed(2),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = VehicleBatterySimulator;
