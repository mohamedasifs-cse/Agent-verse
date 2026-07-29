# EV Multi-Agent Operating System

A production-quality MERN stack web application with an 8-agent AI architecture for EV owners.

## Architecture

```
User Request → Supervisor Agent
  → [1] Battery Intelligence Agent
  → [2] Route Agent + Charging Agent (parallel)
  → [3] Emergency Agent (always runs)
  → [4] Energy Agent + Pricing Agent (parallel)
  → [5] Analytics Agent
  → Groq Final Synthesis → Response
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key (free at https://console.groq.com)
- OpenChargeMap API key (free at https://openchargemap.org/site/develop/api)

## Setup

### 1. Get API Keys

**Groq API Key (free):**
1. Go to https://console.groq.com
2. Sign up / log in
3. Navigate to API Keys → Create API Key
4. Copy the key

**OpenChargeMap API Key (free):**
1. Go to https://openchargemap.org/site/develop/api
2. Click "Register for an API Key"
3. Fill in the form (it's free, no billing)
4. Copy the key from your profile

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```
GROQ_API_KEY=gsk_your_actual_groq_key_here
OCM_API_KEY=your_openchargemap_key_here
MONGODB_URI=mongodb://localhost:27017/ev_multiagent
PORT=5000
```

Start backend:
```bash
npm run dev
# or: node server.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

The app opens at http://localhost:3000

## Usage

1. Open http://localhost:3000
2. The battery simulator starts automatically (watch the live telemetry)
3. Use **Simulator Controls** to switch between idle/driving/charging modes
4. Click **"Run 8-Agent Analysis"** to activate all agents
5. Watch the **Agents tab** for the 3D network graph and collaboration console
6. Check the **Map tab** for real charging stations near San Francisco
7. View the **Reports tab** for analytics after running analysis

## Features

| Feature | Description |
|---------|-------------|
| Live Telemetry | Physics-based battery simulation via WebSocket |
| 3D Vehicle | Procedural low-poly car, color-coded by battery status |
| 3D Battery Tank | Animated fill level matching real SOC % |
| 3D Agent Network | Glowing nodes pulse when agents are active |
| Real Charging Stations | Live data from OpenChargeMap API |
| Emergency V2V | Simulated vehicle-to-vehicle energy sharing |
| 8 AI Agents | Groq LLaMA-3.3-70B + LLaMA-3.1-8B reasoning |

## Project Structure

```
backend/
  agents/          # 8 AI agent modules + supervisor
  simulators/      # Physics-based battery simulator
  utils/           # Groq client, OCM fetcher, distance calculator
  models/          # MongoDB schemas
  routes/          # Express API routes
  server.js        # Main server + Socket.io

frontend/src/
  components/      # React components (3D, map, panels)
  hooks/           # useEVSystem (socket + API)
  App.js           # Main application
```

## Notes

- MongoDB is optional — the app runs without it (no persistence)
- Without OCM API key, charging stations won't load (agents still work with fallback)
- Without Groq API key, agents return physics-based fallback responses
