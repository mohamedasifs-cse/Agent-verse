from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional, Dict, Any, List
import uuid

from models.schemas import VehicleModel, ChargingSessionModel, AnalyzeRequest, ModeRequest
from agents.supervisor_agent import supervisor_agent
from utils.charging_station_fetcher import fetch_nearby_stations

router = APIRouter(prefix="/api", tags=["api"])

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
