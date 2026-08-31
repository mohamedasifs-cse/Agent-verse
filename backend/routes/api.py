from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional, Dict, Any, List
import uuid
import asyncio
import datetime

from models.schemas import VehicleModel, ChargingSessionModel, AnalyzeRequest, ModeRequest, BookingModel, BookSlotRequest, JoinQueueRequest
from agents.supervisor_agent import supervisor_agent
from utils.charging_station_fetcher import fetch_nearby_stations

router = APIRouter(prefix="/api", tags=["api"])
booking_lock = asyncio.Lock()


# In-memory stores for fallback when MongoDB is not connected
IN_MEMORY_VEHICLES: List[Dict[str, Any]] = [
    {
        "id": "demo_v1",
        "userId": "demo",
        "name": "Tesla Model 3 Long Range",
        "make": "Tesla",
        "model": "Model 3",
        "year": 2023,
        "batteryCapacityKwh": 75,
        "maxRangeKm": 500,
        "lat": 37.7749,
        "lon": -122.4194,
    }
]
IN_MEMORY_SESSIONS: List[Dict[str, Any]] = []

@router.get("/vehicles")
async def get_vehicles(userId: str = "demo"):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            vehicles = await db.vehicles.find({"userId": userId}).to_list(100)
            for v in vehicles:
                v["id"] = str(v.pop("_id", ""))
            return vehicles
        except Exception:
            pass
    return [v for v in IN_MEMORY_VEHICLES if v.get("userId") == userId]

@router.post("/vehicles")
async def create_vehicle(vehicle: VehicleModel):
    v_dict = vehicle.dict()
    v_id = str(uuid.uuid4())[:8]
    v_dict["id"] = v_id
    db = getattr(router, "db", None)
    if db is not None:
        try:
            res = await db.vehicles.insert_one(v_dict)
            v_dict["id"] = str(res.inserted_id)
            return v_dict
        except Exception:
            pass
    IN_MEMORY_VEHICLES.append(v_dict)
    return v_dict

@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, data: Dict[str, Any]):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            await db.vehicles.update_one({"_id": vehicle_id}, {"$set": data})
            return {"id": vehicle_id, **data}
        except Exception:
            pass
    for v in IN_MEMORY_VEHICLES:
        if v["id"] == vehicle_id:
            v.update(data)
            return v
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            await db.vehicles.delete_one({"_id": vehicle_id})
            return {"success": True}
        except Exception:
            pass
    global IN_MEMORY_VEHICLES
    IN_MEMORY_VEHICLES = [v for v in IN_MEMORY_VEHICLES if v["id"] != vehicle_id]
    return {"success": True}

@router.get("/charging-history/{vehicle_id}")
async def get_charging_history(vehicle_id: str):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            sessions = await db.charging_sessions.find({"vehicleId": vehicle_id}).sort("timestamp", -1).limit(50).to_list(50)
            for s in sessions:
                s["id"] = str(s.pop("_id", ""))
            return sessions
        except Exception:
            pass
    return [s for s in IN_MEMORY_SESSIONS if s.get("vehicleId") == vehicle_id]

@router.post("/charging-session")
async def create_charging_session(session: ChargingSessionModel):
    s_dict = session.dict()
    s_id = str(uuid.uuid4())[:8]
    s_dict["id"] = s_id
    db = getattr(router, "db", None)
    if db is not None:
        try:
            res = await db.charging_sessions.insert_one(s_dict)
            s_dict["id"] = str(res.inserted_id)
            return s_dict
        except Exception:
            pass
    IN_MEMORY_SESSIONS.append(s_dict)
    return s_dict

@router.post("/analyze")
async def analyze_endpoint(body: AnalyzeRequest, request: Request):
    telemetry = body.telemetry or {}
    v_type = telemetry.get("vehicleType") or body.vehicleType or "car"
    v_model = telemetry.get("vehicleModel") or body.vehicleModel or ("Ola S1 Pro" if v_type == "bike" else "Porsche Taycan EV")

    default_range = 120.0 if v_type == "bike" else 300.0
    safe_telemetry = {
        "soc": 70,
        "soh": 90,
        "temperatureC": 25,
        "temperatureStatus": "normal",
        "estimatedRangeKm": default_range,
        "mode": "idle",
        "speedKmh": 0,
        "chargingPowerKw": 0,
        "totalDistanceKm": 0,
        "totalEnergyChargedKwh": 0,
        "vehicleType": v_type,
        "vehicleModel": v_model,
        **telemetry,
    }

    vehicle_id = body.vehicleId
    charging_history = []
    if vehicle_id:
        db = getattr(router, "db", None)
        if db is not None:
            try:
                charging_history = await db.charging_sessions.find({"vehicleId": vehicle_id}).sort("timestamp", -1).limit(20).to_list(20)
            except Exception:
                charging_history = []

    sio = getattr(request.app.state, "sio", None)
    origin_dict = body.origin.dict() if body.origin else None
    destination_dict = body.destination.dict() if body.destination else None

    request_data = {
        "telemetry": safe_telemetry,
        "origin": origin_dict,
        "destination": destination_dict,
        "chargingHistory": charging_history,
        "vehicleType": v_type,
        "vehicleModel": v_model,
    }

    try:
        result = await supervisor_agent(request_data, sio)
        return result
    except Exception as err:
        print(f"[API /analyze] Error: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/stations")
async def get_stations(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius: float = Query(25.0, description="Radius in km"),
    max: int = Query(15, description="Max results")
):
    try:
        stations = await fetch_nearby_stations(lat, lon, radius, max)
        return {"stations": stations, "count": len(stations)}
    except Exception as err:
        print(f"[API /stations] Error: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.post("/simulator/{vehicle_id}/mode")
async def set_simulator_mode(vehicle_id: str, body: ModeRequest, request: Request):
    simulators = getattr(request.app.state, "simulators", {})
    sim = simulators.get(vehicle_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulator not found")
    sim.set_mode(body.mode, body.params or {})
    return {"success": True, "mode": body.mode}

@router.get("/simulator/{vehicle_id}/telemetry")
async def get_simulator_telemetry(vehicle_id: str, request: Request):
    simulators = getattr(request.app.state, "simulators", {})
    sim = simulators.get(vehicle_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulator not found")
    return sim.get_telemetry()


# ── EV CHARGING SLOT BOOKING + QUEUE MANAGEMENT APIs ──────────────────────────────

IN_MEMORY_BOOKINGS: List[Dict[str, Any]] = []

STANDARD_TIME_SLOTS = [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
    "08:00 PM"
]

async def _get_all_bookings_raw():
    db = getattr(router, "db", None)
    if db is not None:
        try:
            bookings = await db.bookings.find({}).to_list(500)
            for b in bookings:
                b["id"] = str(b.pop("_id", ""))
            return bookings
        except Exception:
            pass
    return list(IN_MEMORY_BOOKINGS)

async def _save_booking_raw(booking_dict: Dict[str, Any]):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            res = await db.bookings.insert_one(dict(booking_dict))
            booking_dict["id"] = str(res.inserted_id)
            return booking_dict
        except Exception:
            pass
    IN_MEMORY_BOOKINGS.append(booking_dict)
    return booking_dict

async def _update_booking_raw(booking_id: str, updates: Dict[str, Any]):
    db = getattr(router, "db", None)
    if db is not None:
        try:
            await db.bookings.update_one({"bookingId": booking_id}, {"$set": updates})
        except Exception:
            pass
    for b in IN_MEMORY_BOOKINGS:
        if b.get("bookingId") == booking_id or b.get("id") == booking_id:
            b.update(updates)
            b["updatedAt"] = datetime.datetime.utcnow().isoformat() + "Z"

async def _recalculate_station_queue(station_id: str, request: Optional[Request] = None):
    all_b = await _get_all_bookings_raw()
    station_b = [
        b for b in all_b
        if b.get("stationId") == str(station_id) and b.get("status") in ["BOOKED", "WAITING", "CHARGING"]
    ]
    station_b.sort(key=lambda x: x.get("createdAt", ""))

    waiting_counter = 0
    for b in station_b:
        st = b.get("status")
        if st == "CHARGING":
            new_pos = 1
            est_wait = 0
        else:
            waiting_counter += 1
            new_pos = waiting_counter
            est_wait = (new_pos - 1) * 15

        if b.get("queuePosition") != new_pos or b.get("estimatedWaitTime") != est_wait:
            await _update_booking_raw(b["bookingId"], {
                "queuePosition": new_pos,
                "estimatedWaitTime": est_wait
            })
            b["queuePosition"] = new_pos
            b["estimatedWaitTime"] = est_wait

    if request:
        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                active_queue = [
                    {
                        "bookingId": b.get("bookingId"),
                        "userId": b.get("userId"),
                        "vehicleId": b.get("vehicleId"),
                        "status": b.get("status"),
                        "queuePosition": b.get("queuePosition"),
                        "startTime": b.get("startTime"),
                        "estimatedWaitTime": b.get("estimatedWaitTime"),
                    }
                    for b in station_b
                ]
                await sio.emit("queue:updated", {
                    "stationId": str(station_id),
                    "queueCount": len(station_b),
                    "queue": active_queue
                })
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

@router.get("/charging-stations/{station_id}/slots")
async def get_station_slots(station_id: str, date: Optional[str] = None):
    target_date = date or datetime.date.today().strftime("%Y-%m-%d")
    all_b = await _get_all_bookings_raw()

    station_b = [
        b for b in all_b
        if b.get("stationId") == str(station_id)
        and b.get("date") == target_date
        and b.get("status") in ["BOOKED", "WAITING", "CHARGING"]
    ]

    booked_times = {b.get("startTime"): b for b in station_b}

    total_chargers = 6
    slots = []
    booked_count = 0

    for idx, st_time in enumerate(STANDARD_TIME_SLOTS):
        existing = booked_times.get(st_time)
        if existing:
            status = existing.get("status", "BOOKED")
            if status == "CHARGING":
                status = "IN PROGRESS"
            slots.append({
                "slotId": f"slot-{idx+1}",
                "startTime": st_time,
                "status": status,
                "bookingId": existing.get("bookingId"),
                "chargerId": existing.get("chargerId", "charger-1")
            })
            booked_count += 1
        else:
            slots.append({
                "slotId": f"slot-{idx+1}",
                "startTime": st_time,
                "status": "AVAILABLE",
                "chargerId": f"charger-{(idx % total_chargers) + 1}"
            })

    active_queue = [
        b for b in all_b
        if b.get("stationId") == str(station_id) and b.get("status") in ["BOOKED", "WAITING", "CHARGING"]
    ]
    queue_count = len([b for b in active_queue if b.get("status") in ["BOOKED", "WAITING"]])
    available_bays = max(0, total_chargers - min(total_chargers, len(active_queue)))

    return {
        "stationId": station_id,
        "date": target_date,
        "totalChargers": total_chargers,
        "availableChargers": available_bays,
        "occupiedChargers": total_chargers - available_bays,
        "currentQueueCount": queue_count,
        "estimatedWaitTimeMinutes": queue_count * 15,
        "slots": slots
    }

@router.post("/charging-stations/{station_id}/book")
async def book_charging_slot(station_id: str, body: BookSlotRequest, request: Request):
    async with booking_lock:
        target_date = body.date or datetime.date.today().strftime("%Y-%m-%d")
        all_b = await _get_all_bookings_raw()

        # Double-booking protection: Check if slot is already reserved for this station & start time
        for b in all_b:
            if (b.get("stationId") == str(station_id) and
                b.get("date") == target_date and
                b.get("startTime") == body.startTime and
                b.get("chargerId") == (body.chargerId or "charger-1") and
                b.get("status") in ["BOOKED", "CHARGING"]):
                raise HTTPException(
                    status_code=409,
                    detail="This charging slot is no longer available."
                )

        # Also check if user already has an active conflicting booking at the same time
        for b in all_b:
            if (b.get("userId") == body.userId and
                b.get("date") == target_date and
                b.get("startTime") == body.startTime and
                b.get("status") in ["BOOKED", "CHARGING", "WAITING"]):
                raise HTTPException(
                    status_code=400,
                    detail="You already have an active booking at this time slot."
                )

        station_b = [
            b for b in all_b
            if b.get("stationId") == str(station_id) and b.get("status") in ["BOOKED", "WAITING", "CHARGING"]
        ]
        q_pos = len(station_b) + 1
        est_wait = (q_pos - 1) * 15

        now_str = datetime.datetime.utcnow().isoformat() + "Z"
        booking_code = f"EV-BOOK-{uuid.uuid4().hex[:6].upper()}"

        new_booking = {
            "bookingId": booking_code,
            "userId": body.userId,
            "vehicleId": body.vehicleId or "demo_v1",
            "stationId": str(station_id),
            "stationName": body.stationName,
            "chargerId": body.chargerId or "charger-1",
            "chargerType": body.chargerType or "DC Fast Charger",
            "powerKw": body.powerKw or 150.0,
            "date": target_date,
            "startTime": body.startTime,
            "endTime": "11:00 AM",
            "durationMinutes": body.durationMinutes or 30,
            "status": "BOOKED",
            "queuePosition": q_pos,
            "estimatedWaitTime": est_wait,
            "createdAt": now_str,
            "updatedAt": now_str
        }

        saved = await _save_booking_raw(new_booking)
        await _recalculate_station_queue(station_id, request)

        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                await sio.emit("booking:updated", saved)
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

        return saved

@router.post("/charging-stations/{station_id}/queue")
async def join_station_queue(station_id: str, body: JoinQueueRequest, request: Request):
    async with booking_lock:
        target_date = datetime.date.today().strftime("%Y-%m-%d")
        all_b = await _get_all_bookings_raw()

        # Check if user is already in queue for this station
        for b in all_b:
            if (b.get("userId") == body.userId and
                b.get("stationId") == str(station_id) and
                b.get("status") in ["BOOKED", "WAITING", "CHARGING"]):
                raise HTTPException(
                    status_code=400,
                    detail="You are already in queue or have a booking for this station."
                )

        station_b = [
            b for b in all_b
            if b.get("stationId") == str(station_id) and b.get("status") in ["BOOKED", "WAITING", "CHARGING"]
        ]
        q_pos = len(station_b) + 1
        est_wait = (q_pos - 1) * 15

        now_str = datetime.datetime.utcnow().isoformat() + "Z"
        booking_code = f"EV-QUEUE-{uuid.uuid4().hex[:6].upper()}"

        queue_booking = {
            "bookingId": booking_code,
            "userId": body.userId,
            "vehicleId": body.vehicleId or "demo_v1",
            "stationId": str(station_id),
            "stationName": body.stationName,
            "chargerId": "charger-queue",
            "chargerType": body.chargerType or "DC Fast Charger",
            "powerKw": body.powerKw or 150.0,
            "date": target_date,
            "startTime": "Next Available",
            "endTime": "Flex",
            "durationMinutes": 30,
            "status": "WAITING",
            "queuePosition": q_pos,
            "estimatedWaitTime": est_wait,
            "createdAt": now_str,
            "updatedAt": now_str
        }

        saved = await _save_booking_raw(queue_booking)
        await _recalculate_station_queue(station_id, request)

        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                await sio.emit("booking:updated", saved)
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

        return saved

@router.get("/bookings")
async def get_user_bookings(userId: str = "demo"):
    all_b = await _get_all_bookings_raw()
    user_b = [b for b in all_b if b.get("userId") == userId]
    user_b.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return user_b

@router.get("/bookings/{booking_id}")
async def get_booking_by_id(booking_id: str):
    all_b = await _get_all_bookings_raw()
    for b in all_b:
        if b.get("bookingId") == booking_id or b.get("id") == booking_id:
            return b
    raise HTTPException(status_code=404, detail="Booking not found")

@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request):
    async with booking_lock:
        all_b = await _get_all_bookings_raw()
        target = None
        for b in all_b:
            if b.get("bookingId") == booking_id or b.get("id") == booking_id:
                target = b
                break

        if not target:
            raise HTTPException(status_code=404, detail="Booking not found")

        station_id = target.get("stationId")
        await _update_booking_raw(booking_id, {
            "status": "CANCELLED",
            "queuePosition": 0,
            "estimatedWaitTime": 0
        })
        target["status"] = "CANCELLED"
        target["queuePosition"] = 0

        if station_id:
            await _recalculate_station_queue(station_id, request)

        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                await sio.emit("booking:updated", target)
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

        return {"success": True, "message": "Booking cancelled successfully.", "booking": target}

@router.post("/bookings/{booking_id}/start-charging")
async def start_charging_booking(booking_id: str, request: Request):
    async with booking_lock:
        all_b = await _get_all_bookings_raw()
        target = None
        for b in all_b:
            if b.get("bookingId") == booking_id or b.get("id") == booking_id:
                target = b
                break

        if not target:
            raise HTTPException(status_code=404, detail="Booking not found")

        await _update_booking_raw(booking_id, {
            "status": "CHARGING",
            "queuePosition": 1,
            "estimatedWaitTime": 0
        })
        target["status"] = "CHARGING"
        target["queuePosition"] = 1

        # Integrate with simulator mode if active
        simulators = getattr(request.app.state, "simulators", {})
        sim = simulators.get(target.get("vehicleId", "demo_v1"))
        if sim:
            sim.set_mode("charging", {"powerKw": target.get("powerKw", 150)})

        if target.get("stationId"):
            await _recalculate_station_queue(target.get("stationId"), request)

        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                await sio.emit("booking:updated", target)
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

        return target

@router.post("/bookings/{booking_id}/complete-charging")
async def complete_charging_booking(booking_id: str, request: Request):
    async with booking_lock:
        all_b = await _get_all_bookings_raw()
        target = None
        for b in all_b:
            if b.get("bookingId") == booking_id or b.get("id") == booking_id:
                target = b
                break

        if not target:
            raise HTTPException(status_code=404, detail="Booking not found")

        await _update_booking_raw(booking_id, {
            "status": "COMPLETED",
            "queuePosition": 0,
            "estimatedWaitTime": 0
        })
        target["status"] = "COMPLETED"

        # Record charging session into existing charging history
        session_dict = {
            "id": f"session-{uuid.uuid4().hex[:6]}",
            "vehicleId": target.get("vehicleId", "demo_v1"),
            "stationName": target.get("stationName", "Fast Charging Hub"),
            "stationId": target.get("stationId"),
            "energyKwh": round(15.0 + (target.get("durationMinutes", 30) / 60.0) * target.get("powerKw", 150) * 0.8, 1),
            "cost": round(15.0 * 20.0, 2),
            "durationMinutes": target.get("durationMinutes", 30),
            "startSoc": 25,
            "endSoc": 85,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        IN_MEMORY_SESSIONS.append(session_dict)

        # Stop simulator charging mode if running
        simulators = getattr(request.app.state, "simulators", {})
        sim = simulators.get(target.get("vehicleId", "demo_v1"))
        if sim:
            sim.set_mode("idle", {})

        if target.get("stationId"):
            await _recalculate_station_queue(target.get("stationId"), request)

        sio = getattr(request.app.state, "sio", None)
        if sio:
            try:
                await sio.emit("booking:updated", target)
            except Exception as e:
                print(f"[Socket Emit Error]: {e}")

        return target

