import asyncio
import datetime
from typing import Dict, Any, Optional

class VehicleBatterySimulator:
    def __init__(self, sio, vehicle_id: str, options: Optional[Dict[str, Any]] = None):
        options = options or {}
        self.sio = sio
        self.vehicle_id = vehicle_id

        # Vehicle type & model
        self.vehicle_type = options.get("vehicleType", "car")  # car | bike
        self.vehicle_model = options.get("vehicleModel", "Porsche Taycan EV" if self.vehicle_type == "car" else "Ola S1 Pro")

        # Battery specs auto-configured based on vehicle type if not explicitly passed
        if self.vehicle_type == "bike":
            self.capacity_kwh = float(options.get("capacityKwh", 4.0))
            self.max_range_km = float(options.get("maxRangeKm", 135.0))
        else:
            self.capacity_kwh = float(options.get("capacityKwh", 75.0))
            self.max_range_km = float(options.get("maxRangeKm", 500.0))

        # State
        self.soc = float(options.get("initialSoc", 80.0))
        self.soh = float(options.get("initialSoh", 95.0))
        self.temperature_c = float(options.get("initialTemp", 25.0))
        self.speed_kmh = 0.0
        self.mode = "idle"  # idle | driving | charging
        self.charging_power_kw = 0.0
        self.total_energy_charged = 0.0
        self.total_distance_km = 0.0
        self.continuous_ride_minutes = 0.0
        self.rain_active = False

        self.tick_ms = options.get("tickMs", 60000)
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        print(f"[Simulator] Vehicle {self.vehicle_id} ({self.vehicle_type}: {self.vehicle_model}) started")

    def stop(self):
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None
        print(f"[Simulator] Vehicle {self.vehicle_id} stopped")

    def set_vehicle_info(self, vehicle_type: str, vehicle_model: str):
        self.vehicle_type = vehicle_type
        self.vehicle_model = vehicle_model
        if vehicle_type == "bike":
            self.capacity_kwh = 4.0
            self.max_range_km = 135.0
        else:
            self.capacity_kwh = 75.0
            self.max_range_km = 500.0

    def set_mode(self, mode: str, params: Optional[Dict[str, Any]] = None):
        params = params or {}
        if "vehicleType" in params:
            v_type = params["vehicleType"]
            v_model = params.get("vehicleModel", "Ola S1 Pro" if v_type == "bike" else "Porsche Taycan EV")
            self.set_vehicle_info(v_type, v_model)

        self.mode = mode
        if mode == "driving":
            default_speed = 45.0 if self.vehicle_type == "bike" else 80.0
            self.speed_kmh = float(params.get("speedKmh", default_speed))
            self.charging_power_kw = 0.0
        elif mode == "charging":
            default_power = 2.5 if self.vehicle_type == "bike" else 50.0
            self.speed_kmh = 0.0
            self.charging_power_kw = float(params.get("powerKw", default_power))
        elif mode == "overheat":
            self.temperature_c = 48.0
        elif mode == "rain":
            self.rain_active = True
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
            if self.vehicle_type == "bike":
                # Bike energy consumption: ~3.0 kWh per 100km
                consumption_kwh_per_100 = 3.0 + (self.speed_kmh - 35.0) * 0.04
                distance_tick = self.speed_kmh * tick_hours
                energy_used_kwh = (consumption_kwh_per_100 / 100.0) * distance_tick
                soc_drop = (energy_used_kwh / (self.capacity_kwh * (self.soh / 100.0))) * 100.0
                self.continuous_ride_minutes += (self.tick_ms / 60000.0)
            else:
                consumption_kwh_per_100 = 15.0 + (self.speed_kmh - 60.0) * 0.08
                distance_tick = self.speed_kmh * tick_hours
                energy_used_kwh = (consumption_kwh_per_100 / 100.0) * distance_tick
                soc_drop = (energy_used_kwh / (self.capacity_kwh * (self.soh / 100.0))) * 100.0

            self.soc = max(0.0, self.soc - soc_drop)
            self.total_distance_km += distance_tick

            max_expected_speed = 90.0 if self.vehicle_type == "bike" else 120.0
            target_temp = 25.0 + (self.speed_kmh / max_expected_speed) * 18.0
            self.temperature_c += (target_temp - self.temperature_c) * 0.1
            self.soh = max(70.0, self.soh - 0.0001)

        elif self.mode == "charging":
            efficiency = 0.92 if self.soc < 80 else 0.85
            effective_power = self.charging_power_kw * efficiency
            soc_gain = (effective_power * tick_hours / (self.capacity_kwh * (self.soh / 100.0))) * 100.0

            self.soc = min(100.0, self.soc + soc_gain)
            self.total_energy_charged += effective_power * tick_hours

            denom = 5.0 if self.vehicle_type == "bike" else 150.0
            target_temp = 25.0 + (self.charging_power_kw / denom) * 15.0
            self.temperature_c += (target_temp - self.temperature_c) * 0.15

            if self.soc >= 100.0:
                self.set_mode("idle")

        else:
            vampire_drain = 0.02 * tick_hours if self.vehicle_type == "bike" else 0.0417 * tick_hours
            self.soc = max(0.0, self.soc - vampire_drain)
            self.temperature_c += (22.0 - self.temperature_c) * 0.05
            self.continuous_ride_minutes = max(0.0, self.continuous_ride_minutes - 1.0)

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
            "vehicleType": self.vehicle_type,
            "vehicleModel": self.vehicle_model,
            "capacityKwh": self.capacity_kwh,
            "maxRangeKm": self.max_range_km,
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
            "continuousRideMinutes": round(self.continuous_ride_minutes, 1),
            "rainActive": self.rain_active,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }

