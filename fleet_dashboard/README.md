# Fleet Management Dashboard

A web-based fleet management dashboard for automotive OTA (Over-The-Air) updates using Eclipse Symphony and Ankaios technologies.

## Overview

This dashboard provides a comprehensive solution for managing automotive fleets with real-time monitoring, OTA updates, and staged rollouts. It integrates with Eclipse Symphony for cloud orchestration and Eclipse Ankaios for in-vehicle workload management.

## Features

### 🚗 Car Management
- **Dynamic Car Creation**: Create cars as Ankaios agents with unique metadata
- **Real-time Monitoring**: Live status updates via WebSocket
- **State Management**: Control car states (Parked/Driving) with update constraints
- **Regional Organization**: Organize cars by regions (Munich, Berlin, Hamburg, etc.)

### 🔄 OTA Updates
- **Single Car Updates**: Update individual cars with version control
- **Bulk Updates**: Update multiple cars simultaneously
- **Staged Rollouts**: Phased deployment (e.g., Munich → Berlin)
- **Rollback Support**: Revert to previous versions on failure
- **Update Constraints**: Only update parked cars (configurable)

### 📊 Monitoring & Analytics
- **Real-time Dashboard**: Live fleet overview with key metrics
- **System Health**: Monitor backend services and agent status
- **Logs Viewer**: Real-time logs with filtering and search
- **Performance Metrics**: Charts and statistics for fleet analysis

### 🔧 Advanced Features
- **WebSocket Integration**: Real-time bidirectional communication
- **Symphony Provider**: Cloud orchestration through Eclipse Symphony
- **Ankaios Integration**: Dynamic agent spawning and workload management
- **Failure Handling**: Automatic rollback on update failures
- **Multi-region Support**: Geographic deployment management

## Architecture

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

## Prerequisites

- Node.js 16+ and npm
- Docker and Docker Compose
- Eclipse Ankaios v0.6.0
- Eclipse Symphony 0.48-proxy.41
- Podman (for Ankaios)

## Installation

### 1. Clone and Setup

```bash
git clone <repository-url>
cd fleet_dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create `.env` files in both backend and frontend directories:

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
ANKAIOS_PATH=/usr/local/bin/ank
STATE_FILE_PATH=./ankaios_states
SYMPHONY_API_URL=http://localhost:8082/v1alpha2
MQTT_BROKER_URL=mqtt://localhost:1883
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

## Running the Application

### 1. Start Symphony Services

```bash
cd ../symphony
docker-compose up -d
```

### 2. Start Ankaios

```bash
sudo systemctl start ank-server ank-agent
```

### 3. Start Backend

```bash
cd backend
npm start
```

### 4. Start Frontend

```bash
cd frontend
npm start
```

The dashboard will be available at `http://localhost:3000`

## Usage

### Creating Cars

1. Navigate to the Cars page
2. Click "Add Car" button
3. Select region, initial state, and version
4. Car will be created as an Ankaios agent

### Managing Updates

1. **Single Car Update**: Select a car and choose target version
2. **Bulk Update**: Select multiple cars for simultaneous updates
3. **Staged Rollout**: Configure phases (e.g., Munich → Berlin)
4. **Rollback**: Revert cars to previous versions

### Monitoring

1. **Dashboard**: Overview of fleet status and metrics
2. **Logs**: Real-time logs with filtering and search
3. **System Health**: Monitor backend services and agents
4. **Metrics**: Performance charts and statistics

## API Endpoints

### Cars
- `GET /api/cars` - List all cars
- `POST /api/cars` - Create new car
- `PUT /api/cars/:id/state` - Update car state
- `DELETE /api/cars/:id` - Delete car

### Updates
- `POST /api/updates/:id` - Update single car
- `POST /api/updates/bulk` - Bulk update
- `POST /api/updates/staged-rollout` - Staged rollout
- `POST /api/updates/:id/rollback` - Rollback car

### Monitoring
- `GET /api/monitoring/:id/logs` - Get car logs
- `GET /api/monitoring/:id/status` - Get car status
- `GET /api/monitoring/health` - System health
- `GET /api/monitoring/metrics` - Performance metrics

## WebSocket Events

### Car Events
- `car_created` - New car created
- `car_updated` - Car updated
- `car_deleted` - Car deleted
- `car_state_changed` - Car state changed
- `car_status_changed` - Car status changed

### Update Events
- `update_started` - Update initiated
- `update_completed` - Update finished
- `update_failed` - Update failed
- `rollback_started` - Rollback initiated
- `rollback_completed` - Rollback finished

### Rollout Events
- `staged_rollout_started` - Rollout initiated
- `staged_rollout_phase_completed` - Phase completed
- `staged_rollout_completed` - Rollout finished
- `staged_rollout_failed` - Rollout failed

## Configuration

### Staged Rollout Settings

- **Phases**: Configure rollout phases (e.g., Munich → Berlin)
- **Success Threshold**: Minimum success rate to continue (default: 0.8)
- **Wait Time**: Time between phases (default: 5 minutes)
- **Failure Handling**: Automatic rollback on phase failure

### Update Constraints

- **State Validation**: Updates only apply to parked cars
- **Force Updates**: Override state constraints (use with caution)
- **Timeout Settings**: Configure update and rollback timeouts

## Troubleshooting

### Common Issues

1. **Cars not appearing**: Check Ankaios agent status
2. **Updates failing**: Verify Symphony connection
3. **WebSocket disconnects**: Check network connectivity
4. **Agent spawn failures**: Verify Ankaios installation

### Logs

- Backend logs: `backend/logs/`
- Ankaios logs: `ank logs <workload_name>`
- Symphony logs: Docker container logs

### Health Checks

- Backend health: `GET /api/health`
- System health: `GET /api/monitoring/health`
- WebSocket status: Check connection indicator

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start with nodemon
```

### Frontend Development

```bash
cd frontend
npm start  # Start React development server
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review logs for error messages
- Open an issue on GitHub
- Contact the development team

## Roadmap

- [ ] Advanced analytics and reporting
- [ ] Multi-tenant support
- [ ] API authentication
- [ ] Mobile app companion
- [ ] Integration with more Eclipse projects
- [ ] Advanced policy engine
- [ ] Machine learning for predictive updates
