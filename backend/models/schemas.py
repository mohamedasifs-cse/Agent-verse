import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class VehicleModel(BaseModel):
    id: Optional[str] = None
    userId: str = "demo"
    name: str
    make: Optional[str] = None
    model: Optional[str] = None
    vehicleType: str = "car"  # car | bike
    vehicleModel: Optional[str] = None
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
    vehicleType: Optional[str] = "car"
    vehicleModel: Optional[str] = None


class ModeRequest(BaseModel):
    mode: str
    params: Optional[Dict[str, Any]] = None

class BookingModel(BaseModel):
    id: Optional[str] = None
    bookingId: str
    userId: str = "demo"
    vehicleId: Optional[str] = "demo_v1"
    stationId: str
    stationName: str
    chargerId: str = "charger-1"
    chargerType: str = "DC Fast Charger"
    powerKw: float = 150.0
    date: str
    startTime: str
    endTime: str
    durationMinutes: int = 30
    status: str = "BOOKED"  # BOOKED | WAITING | CHARGING | COMPLETED | CANCELLED | EXPIRED
    queuePosition: int = 0
    estimatedWaitTime: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    updatedAt: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")

class BookSlotRequest(BaseModel):
    userId: str = "demo"
    vehicleId: Optional[str] = "demo_v1"
    stationName: str
    chargerId: Optional[str] = "charger-1"
    chargerType: Optional[str] = "DC Fast Charger"
    powerKw: Optional[float] = 150.0
    date: Optional[str] = None
    startTime: str
    durationMinutes: Optional[int] = 30

class JoinQueueRequest(BaseModel):
    userId: str = "demo"
    vehicleId: Optional[str] = "demo_v1"
    stationName: str
    chargerType: Optional[str] = "DC Fast Charger"
    powerKw: Optional[float] = 150.0

