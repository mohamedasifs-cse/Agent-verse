import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class VehicleModel(BaseModel):
    id: Optional[str] = None
    userId: str = "demo"
    name: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    batteryCapacityKwh: float = 75.0
    maxRangeKm: float = 500.0
    lat: float = 37.7749
    lon: float = -122.4194
    createdAt: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")

class ChargingSessionModel(BaseModel):
    id: Optional[str] = None
    vehicleId: Optional[str] = None
    stationName: Optional[str] = None
    stationId: Optional[int] = None
    energyKwh: Optional[float] = None
    cost: Optional[float] = None
    durationMinutes: Optional[float] = None
    startSoc: Optional[float] = None
    endSoc: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")

class LatLon(BaseModel):
    lat: float
    lon: float

class AnalyzeRequest(BaseModel):
    telemetry: Optional[Dict[str, Any]] = None
    origin: Optional[LatLon] = None
    destination: Optional[LatLon] = None
    vehicleId: Optional[str] = None

class ModeRequest(BaseModel):
    mode: str
    params: Optional[Dict[str, Any]] = None
