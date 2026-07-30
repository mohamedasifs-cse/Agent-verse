import asyncio
import datetime
from typing import Dict, Any, Optional

class VehicleBatterySimulator:
    def __init__(self, sio, vehicle_id: str, options: Optional[Dict[str, Any]] = None):
        options = options or {}
        self.sio = sio
        self.vehicle_id = vehicle_id

        # Battery specs
        self.capacity_kwh = options.get("capacityKwh", 75.0)
        self.max_range_km = options.get("maxRangeKm", 500.0)

        # State
        self.soc = float(options.get("initialSoc", 80.0))
        self.soh = float(options.get("initialSoh", 95.0))
        self.temperature_c = float(options.get("initialTemp", 25.0))
        self.speed_kmh = 0.0
        self.mode = "idle"  # idle | driving | charging
        self.charging_power_kw = 0.0
        self.total_energy_charged = 0.0
        self.total_distance_km = 0.0

        self.tick_ms = options.get("tickMs", 60000)
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        print(f"[Simulator] Vehicle {self.vehicle_id} started")

    def stop(self):
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None
        print(f"[Simulator] Vehicle {self.vehicle_id} stopped")

    def set_mode(self, mode: str, params: Optional[Dict[str, Any]] = None):
        params = params or {}
        self.mode = mode
        if mode == "driving":
            self.speed_kmh = float(params.get("speedKmh", 80.0))
            self.charging_power_kw = 0.0
        elif mode == "charging":
            self.speed_kmh = 0.0
            self.charging_power_kw = float(params.get("powerKw", 50.0))
        else:
            self.speed_kmh = 0.0
            self.charging_power_kw = 0.0

    async def _run_loop(self):
        while self._running:
            try:
                await asyncio.sleep(self.tick_ms / 1000.0)
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulator] Error in vehicle {self.vehicle_id} loop: {e}")

    async def _tick(self):
        tick_hours = self.tick_ms / 3600000.0

        if self.mode == "driving":
            consumption_kwh_per_100 = 15.0 + (self.speed_kmh - 60.0) * 0.08
            distance_tick = self.speed_kmh * tick_hours
            energy_used_kwh = (consumption_kwh_per_100 / 100.0) * distance_tick
            soc_drop = (energy_used_kwh / (self.capacity_kwh * (self.soh / 100.0))) * 100.0

            self.soc = max(0.0, self.soc - soc_drop)
            self.total_distance_km += distance_tick

            target_temp = 25.0 + (self.speed_kmh / 120.0) * 20.0
            self.temperature_c += (target_temp - self.temperature_c) * 0.1
            self.soh = max(70.0, self.soh - 0.0001)

        elif self.mode == "charging":
            efficiency = 0.92 if self.soc < 80 else 0.85
            effective_power = self.charging_power_kw * efficiency
            soc_gain = (effective_power * tick_hours / (self.capacity_kwh * (self.soh / 100.0))) * 100.0

            self.soc = min(100.0, self.soc + soc_gain)
            self.total_energy_charged += effective_power * tick_hours

            target_temp = 25.0 + (self.charging_power_kw / 150.0) * 25.0
            self.temperature_c += (target_temp - self.temperature_c) * 0.15

            if self.soc >= 100.0:
                self.set_mode("idle")

        else:
            vampire_drain = 0.0417 * tick_hours
            self.soc = max(0.0, self.soc - vampire_drain)
            self.temperature_c += (22.0 - self.temperature_c) * 0.05

        self.temperature_c = round(self.temperature_c, 1)
        self.soc = round(self.soc, 2)
        self.soh = round(self.soh, 2)

        telemetry = self.get_telemetry()
        if self.sio:
            await self.sio.emit(f"telemetry:{self.vehicle_id}", telemetry)
            await self.sio.emit("telemetry:latest", {"vehicleId": self.vehicle_id, **telemetry})

    def get_telemetry(self) -> Dict[str, Any]:
        estimated_range_km = round(self.max_range_km * (self.soc / 100.0) * (self.soh / 100.0), 1)
        temp_status = (
            "critical" if self.temperature_c > 45
            else "warm" if self.temperature_c > 35
            else "cold" if self.temperature_c < 5
            else "normal"
        )
        return {
            "vehicleId": self.vehicle_id,
            "soc": self.soc,
            "soh": self.soh,
            "temperatureC": self.temperature_c,
            "temperatureStatus": temp_status,
            "estimatedRangeKm": estimated_range_km,
            "speedKmh": self.speed_kmh,
            "mode": self.mode,
            "chargingPowerKw": self.charging_power_kw,
            "totalDistanceKm": round(self.total_distance_km, 1),
            "totalEnergyChargedKwh": round(self.total_energy_charged, 2),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
