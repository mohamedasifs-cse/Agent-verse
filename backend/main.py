import os
import sys
import socket
import datetime
from dotenv import load_dotenv

load_dotenv()

import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create Socket.IO server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# Create FastAPI app
app = FastAPI(title="EV Multi-Agent OS Backend (Python)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store state
simulators = {}
app.state.simulators = simulators
app.state.sio = sio

# Include Router
from routes.api import router as api_router
app.include_router(api_router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "backend": "Python FastAPI + Socket.IO"
    }

# Socket.IO Event Handlers
from simulators.battery_simulator import VehicleBatterySimulator

@sio.event
async def connect(sid, environ):
    print(f"[Socket] Client connected: {sid}")
    vehicle_id = f"vehicle_{sid[:8]}"
    sim = VehicleBatterySimulator(sio, vehicle_id, {
        "initialSoc": 80,
        "initialSoh": 95,
        "tickMs": 60000,
    })
    sim.start()
    simulators[vehicle_id] = sim

    await sio.emit("simulator:ready", {
        "vehicleId": vehicle_id,
        "telemetry": sim.get_telemetry()
    }, to=sid)

@sio.event
async def disconnect(sid):
    vehicle_id = f"vehicle_{sid[:8]}"
    sim = simulators.pop(vehicle_id, None)
    if sim:
        sim.stop()
    print(f"[Socket] Client disconnected: {sid}")

@sio.on("simulator:setMode")
async def handle_set_mode(sid, data):
    vehicle_id = f"vehicle_{sid[:8]}"
    sim = simulators.get(vehicle_id)
    if sim:
        mode = data.get("mode")
        params = data.get("params", {})
        sim.set_mode(mode, params)
        await sio.emit("simulator:modeChanged", {"mode": mode}, to=sid)

# Combine Socket.IO ASGI app with FastAPI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    while is_port_in_use(port):
        print(f"[Server] Port {port} is busy, trying {port + 1}...")
        port += 1

    print(f"[Server] EV Multi-Agent OS (Python Backend) running on http://localhost:{port}")
    uvicorn.run("main:socket_app", host="0.0.0.0", port=port, reload=True)
