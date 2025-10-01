# ACME Fleet Management Dashboard

A streamlined automotive OTA update system using Eclipse Symphony and Ankaios for fleet management.

## 🎯 What This Does

- **Fleet Management**: View and manage Ankaios agents (cars) in your fleet
- **ECU Deployment**: Deploy different ECU workloads to selected agents
- **Symphony Integration**: Uses Eclipse Symphony for proper orchestration
- **Real-time Status**: Monitor agent status and running workloads

## 🏗️ Architecture

```
Web UI → ACME Controller → Symphony → MQTT → Target Provider → Ankaios
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ankaios with `ank` CLI
- Symphony running on localhost:8082
- MQTT broker (Mosquitto) on localhost:1883

### Setup

1. **Start Symphony:**
   ```bash
   cd /home/ibrahim/challenge-mission-update-possible/symphony
   docker compose up -d
   ```

2. **Start Target Provider:**
   ```bash
   cd /home/ibrahim/challenge-mission-update-possible/fleet_dashboard/backend/symphony-target-provider
   ./setup-symphony.sh
   ```

3. **Start Services:**
   ```bash
   cd /home/ibrahim/challenge-mission-update-possible/fleet_dashboard
   ./start-dev.sh
   ```
   
   Or start individually:
   ```bash
   # Backend (Port 3002)
   cd backend && npm start
   
   # Frontend (Port 3001) 
   cd frontend && npm start
   ```

4. **Access Web UI:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002
   - Select ECU workload and agents
   - Click "Deploy"

## 📁 Project Structure

```
fleet_dashboard/
├── backend/
│   ├── services/
│   │   └── AcmeController.js          # Main ACME logic
│   ├── routes/
│   │   └── acme.js                    # ACME API routes
│   ├── symphony-target-provider/     # Symphony Target Provider
│   └── server.js                      # Backend server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AcmeDashboard.js       # Main dashboard
│   │   │   ├── AcmeDashboard.css     # Dashboard styles
│   │   │   └── Header.js              # Header component
│   │   └── App.js                     # Main app
│   └── build/                         # Built frontend
└── README.md
```

## 🔧 Key Components

### ACME Dashboard
- **Available Agents**: Shows all Ankaios agents with their status
- **Available ECU Workloads**: Predefined ECU types (powertrain, infotainment, etc.)
- **Deployment**: Select workload + agents → Deploy via Symphony

### Symphony Target Provider
- **MQTT Communication**: Listens to Symphony deployment requests
- **Ankaios Integration**: Creates state files and runs `ank apply`
- **Dynamic Deployment**: Handles different workloads and agents

## 🎮 Usage

1. **View Agents**: See all available Ankaios agents and their status
2. **Select Workload**: Choose an ECU workload (e.g., ecu-powertrain)
3. **Select Agents**: Choose one or more target agents
4. **Deploy**: Click "Deploy" to send via Symphony → Target Provider → Ankaios

## 🔍 Monitoring

- **Agent Status**: Real-time CPU usage and memory
- **Running Workloads**: See what's currently running on each agent
- **Deployment Results**: Success/failure status for deployments

## 🛠️ Development

### Backend (Port 3002)
```bash
cd backend
npm install
npm start
```

### Frontend (Port 3001)
```bash
cd frontend
npm install
npm start
```

### Both Services
```bash
./start-dev.sh
```

### Target Provider
```bash
cd backend/symphony-target-provider
npm install
npm start
```

## 📡 API Endpoints

- `GET /api/acme/agents` - List all agents
- `GET /api/acme/workloads` - List all workloads
- `POST /api/acme/deploy` - Deploy workload to agents
- `GET /api/health` - Health check

## 🎯 Features

- ✅ **Symphony Integration**: Proper Eclipse Symphony architecture
- ✅ **MQTT Communication**: Real-time deployment coordination
- ✅ **Ankaios Management**: Direct integration with Ankaios agents
- ✅ **Dynamic Workloads**: Support for different ECU types
- ✅ **Multi-Agent Deployment**: Deploy to multiple agents at once
- ✅ **Real-time Status**: Live monitoring of agent and workload status
- ✅ **Clean Architecture**: Frontend (3001) + Backend (3002) + Target Provider (8081)

## 🔧 Configuration

Environment variables:
- `SYMPHONY_API_URL`: Symphony API endpoint (default: http://localhost:8082/v1alpha2)
- `TARGET_PROVIDER_URL`: Target Provider endpoint (default: http://localhost:8080)
- `ANKAIOS_PATH`: Path to `ank` CLI (default: /usr/local/bin/ank)

## 📋 Requirements

- **Symphony**: Eclipse Symphony orchestrator
- **Ankaios**: Eclipse Ankaios runtime with `ank` CLI
- **MQTT**: Mosquitto broker for communication
- **Node.js**: Backend and Target Provider runtime