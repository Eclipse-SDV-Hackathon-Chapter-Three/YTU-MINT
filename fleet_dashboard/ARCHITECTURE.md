# Fleet Management Dashboard Architecture

## System Overview

This fleet management dashboard provides a web-based interface for managing automotive OTA updates using Eclipse Symphony and Ankaios technologies.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Fleet Management Dashboard                            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   React Frontend│    │   Node.js API   │    │   WebSocket     │             │
│  │   - Car Grid    │◄──►│   - /cars       │◄──►│   Real-time     │             │
│  │   - Controls    │    │   - /create-car │    │   Updates       │             │
│  │   - Status      │    │   - /update     │    │                 │             │
│  │   - Logs        │    │   - /rollback   │    │                 │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Backend Services                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   Car Manager   │    │   Ankaios        │    │   Symphony      │             │
│  │   - Spawn Agents│◄──►│   Controller     │◄──►│   Provider      │             │
│  │   - State Mgmt  │    │   - Child Procs  │    │   - Updates     │             │
│  │   - Metadata    │    │   - Workloads    │    │   - Rollbacks   │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Ankaios Agents                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   Car Agent A   │    │   Car Agent B   │    │   Car Agent N   │             │
│  │   - Munich      │    │   - Berlin      │    │   - Region X    │             │
│  │   - Parked      │    │   - Driving      │    │   - Status      │             │
│  │   - v1.2.3      │    │   - v1.2.1      │    │   - v1.2.2      │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Symphony Cloud                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   MQTT Broker   │    │   Symphony API  │    │   Update Store  │             │
│  │   - Updates     │    │   - Management  │    │   - Packages    │             │
│  │   - Commands    │    │   - Orchestr.   │    │   - Versions    │             │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Car Creation Flow
```
Frontend → Backend API → Car Manager → Ankaios Controller → Spawn Agent → Symphony Registration
```

### 2. Update Flow
```
Frontend → Backend API → Symphony Provider → MQTT → Ankaios Agent → Workload Update
```

### 3. Status Monitoring Flow
```
Ankaios Agent → Backend Polling → WebSocket → Frontend → Real-time Display
```

### 4. Staged Rollout Flow
```
Frontend → Backend → Symphony Provider → Munich Cars → Success Check → Berlin Cars
```

## Key Components

### Frontend (React)
- **Car Grid**: Real-time table showing all cars with status, version, region
- **Control Panel**: Buttons for create, update, rollback, stop operations
- **Status Indicators**: Color-coded status (Green=OK, Yellow=Updating, Red=Failed, Gray=Parked)
- **Logs Viewer**: Real-time logs and version metadata display

### Backend (Node.js)
- **Car Manager**: Handles car lifecycle, metadata, state management
- **Ankaios Controller**: Spawns and manages Ankaios agents as child processes
- **Symphony Integration**: Communicates with Symphony Provider for updates
- **WebSocket Server**: Real-time status updates to frontend

### Ankaios Agents
- **Dynamic Spawning**: Each car is an Ankaios agent with unique name
- **Metadata**: Region, state (parked/driving), version, status
- **Workload Management**: Runs car-specific workloads and containers

### Symphony Integration
- **Provider Communication**: All updates go through Symphony Provider
- **MQTT Messaging**: Secure communication with cloud orchestrator
- **Update Orchestration**: Manages staged rollouts and rollbacks

## API Endpoints

### Car Management
- `GET /api/cars` - List all cars
- `POST /api/cars` - Create new car
- `PUT /api/cars/:id/state` - Update car state (parked/driving)
- `DELETE /api/cars/:id` - Stop/remove car

### Update Operations
- `POST /api/cars/:id/update` - Update specific car
- `POST /api/cars/bulk-update` - Update multiple cars
- `POST /api/cars/rollback` - Rollback cars
- `POST /api/cars/staged-rollout` - Staged rollout by region

### Monitoring
- `GET /api/cars/:id/logs` - Get car logs
- `GET /api/cars/:id/status` - Get car status
- `WebSocket /ws` - Real-time updates

## Staged Rollout Logic

### Munich → Berlin Example
1. **Phase 1**: Update all cars in Munich
2. **Success Check**: Monitor for 5 minutes
3. **Phase 2**: If successful, update Berlin cars
4. **Rollback**: If Munich fails, rollback all Munich cars

### Failure Handling
- **Individual Failure**: Rollback specific car
- **Regional Failure**: Rollback entire region
- **System Failure**: Emergency stop all updates

## Security & Constraints

### Update Constraints
- **Parked Only**: Updates only apply when car is parked
- **State Validation**: Backend validates car state before updates
- **Rollback Safety**: Automatic rollback on update failures

### Communication Security
- **MQTT TLS**: Encrypted communication with Symphony
- **API Authentication**: Secure backend API endpoints
- **Agent Isolation**: Each car agent runs in isolated environment
