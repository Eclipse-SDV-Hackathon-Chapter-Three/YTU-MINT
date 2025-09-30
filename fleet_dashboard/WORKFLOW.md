# Fleet Management Dashboard - Workflow Documentation

## Overview

This document describes the detailed workflows and interaction flows for the Fleet Management Dashboard, showing how the web dashboard interacts with backend services, Ankaios agents, and Symphony Provider for automotive OTA updates.

## System Components

### 1. Web Dashboard (React Frontend)
- **Purpose**: User interface for fleet management
- **Technology**: React 18 with real-time WebSocket updates
- **Features**: Car grid, update controls, monitoring, logs viewer

### 2. Backend Services (Node.js)
- **Car Manager**: Handles car lifecycle and metadata
- **Ankaios Controller**: Manages Ankaios agents as child processes
- **Symphony Provider**: Communicates with Symphony cloud orchestrator
- **WebSocket Manager**: Real-time bidirectional communication

### 3. Ankaios Agents
- **Purpose**: Each car is represented by an Ankaios agent
- **Management**: Dynamic spawning with unique names and metadata
- **Workloads**: Run car-specific containers and workloads

### 4. Symphony Cloud
- **Purpose**: Cloud orchestration and update management
- **Components**: Symphony API, MQTT broker, update store
- **Communication**: MQTT messaging for updates and commands

## Detailed Workflows

### 1. Car Creation Workflow

```
User Action: Create Car
    ↓
Frontend → Backend API (/api/cars POST)
    ↓
Car Manager: Create car metadata
    ↓
Ankaios Controller: Spawn agent process
    ↓
Symphony Provider: Create Symphony target
    ↓
WebSocket: Notify frontend (car_created)
    ↓
Frontend: Update car grid display
```

**Step-by-step Process:**

1. **User Input**: User fills out car creation form (region, state, version)
2. **API Call**: Frontend sends POST request to `/api/cars`
3. **Car Creation**: CarManager creates car object with unique ID and metadata
4. **Agent Spawning**: AnkaiosController spawns Ankaios agent as child process
5. **Symphony Registration**: SymphonyProvider creates target in Symphony cloud
6. **Real-time Update**: WebSocket notifies all connected clients
7. **UI Update**: Frontend updates car grid with new car

**Key Components:**
- Car metadata includes: ID, name, region, state, version, agent name
- Ankaios agent runs as child process with unique name
- Symphony target created for cloud orchestration
- WebSocket broadcast ensures real-time updates

### 2. Update Workflow (Single Car)

```
User Action: Update Car
    ↓
Frontend: Validate car state (must be parked)
    ↓
Backend API: POST /api/updates/:id
    ↓
Symphony Provider: Send update command via MQTT
    ↓
Ankaios Agent: Receive update, modify workload
    ↓
Symphony Provider: Monitor update status
    ↓
WebSocket: Notify frontend (update_completed/failed)
    ↓
Frontend: Update car status and version
```

**Step-by-step Process:**

1. **State Validation**: Check if car is parked (required for updates)
2. **Update Command**: Send update payload to Symphony via MQTT
3. **Agent Processing**: Ankaios agent receives and processes update
4. **Workload Modification**: Agent updates container image/configuration
5. **Status Monitoring**: Symphony Provider monitors update progress
6. **Completion Notification**: WebSocket notifies frontend of result
7. **UI Update**: Frontend updates car status and version display

**Update Constraints:**
- Cars must be in "parked" state (configurable with force option)
- Update timeout: 5 minutes (configurable)
- Automatic rollback on failure
- Version validation and compatibility checks

### 3. Staged Rollout Workflow

```
User Action: Start Staged Rollout
    ↓
Frontend: Configure phases (Munich → Berlin)
    ↓
Backend API: POST /api/updates/staged-rollout
    ↓
Symphony Provider: Execute phase 1 (Munich)
    ↓
Success Check: Monitor phase 1 results
    ↓
If Success: Execute phase 2 (Berlin)
    ↓
If Failure: Rollback phase 1
    ↓
WebSocket: Notify frontend of each phase
    ↓
Frontend: Display rollout progress
```

**Phase Execution:**

1. **Phase 1 (Munich)**:
   - Update all cars in Munich region
   - Monitor success rate (default: 80%)
   - Wait for completion or timeout

2. **Success Check**:
   - Calculate success rate: successful_updates / total_cars
   - Compare against threshold (default: 0.8)
   - If below threshold: initiate rollback

3. **Phase 2 (Berlin)**:
   - Only execute if Phase 1 successful
   - Update all cars in Berlin region
   - Monitor and report results

4. **Failure Handling**:
   - Automatic rollback of failed phase
   - Notification of failure reason
   - Option to retry or manual intervention

**Configuration Options:**
- Phases: Configurable regions and order
- Success Threshold: Minimum success rate (0.0-1.0)
- Wait Time: Delay between phases (1-60 minutes)
- Timeout: Maximum time per phase

### 4. Rollback Workflow

```
User Action: Rollback Car
    ↓
Frontend: Select target version
    ↓
Backend API: POST /api/updates/:id/rollback
    ↓
Symphony Provider: Send rollback command
    ↓
Ankaios Agent: Revert to previous version
    ↓
Status Monitoring: Track rollback progress
    ↓
WebSocket: Notify frontend (rollback_completed)
    ↓
Frontend: Update car version display
```

**Rollback Process:**

1. **Version Selection**: User selects target version for rollback
2. **Rollback Command**: Symphony Provider sends rollback via MQTT
3. **Agent Processing**: Ankaios agent reverts workload configuration
4. **Status Monitoring**: Track rollback progress and completion
5. **Completion**: Update car version and notify frontend

**Rollback Constraints:**
- Target version must exist in car's update history
- Rollback timeout: 3 minutes (configurable)
- Automatic status updates during rollback
- Failure handling with retry options

### 5. Real-time Monitoring Workflow

```
Ankaios Agent: Status change
    ↓
Backend: Poll agent status
    ↓
Car Manager: Update car metadata
    ↓
WebSocket: Broadcast status change
    ↓
Frontend: Update car display
    ↓
User: See real-time updates
```

**Monitoring Components:**

1. **Status Polling**: Backend polls Ankaios agents every 5 seconds
2. **State Changes**: Detect status changes (running, updating, failed)
3. **WebSocket Broadcast**: Real-time updates to all connected clients
4. **UI Updates**: Frontend updates car grid and status indicators

**Monitored Metrics:**
- Car status: running, updating, failed, stopped
- Car state: parked, driving
- Agent status: running, failed, stopped
- Update progress: percentage complete
- Error messages: detailed failure information

### 6. Log Management Workflow

```
Ankaios Agent: Generate log entry
    ↓
Backend: Store log in car metadata
    ↓
WebSocket: Broadcast log entry
    ↓
Frontend: Update logs viewer
    ↓
User: View real-time logs
```

**Log Processing:**

1. **Log Generation**: Ankaios agents generate logs during operation
2. **Log Storage**: Backend stores logs in car metadata (max 100 entries)
3. **Real-time Updates**: WebSocket broadcasts new log entries
4. **Log Viewer**: Frontend displays logs with filtering and search
5. **Log Export**: Users can export logs for analysis

**Log Features:**
- Real-time log streaming
- Log level filtering (error, warn, info, debug)
- Search functionality
- Log export (JSON format)
- Automatic log rotation (keep last 100 entries)

## Error Handling and Recovery

### 1. Update Failures

**Detection:**
- Timeout monitoring (5 minutes default)
- Status polling for failure states
- Error message capture from agents

**Recovery:**
- Automatic rollback to previous version
- Error notification via WebSocket
- Manual retry options
- Detailed error logging

### 2. Agent Failures

**Detection:**
- Process exit monitoring
- Health check failures
- Communication timeouts

**Recovery:**
- Automatic agent restart
- Workload recreation
- State synchronization
- Error reporting

### 3. Network Failures

**Detection:**
- MQTT connection monitoring
- WebSocket disconnection detection
- API timeout handling

**Recovery:**
- Automatic reconnection
- Message queuing
- State synchronization
- User notification

## Security Considerations

### 1. Update Security

- **State Validation**: Updates only apply to parked cars
- **Version Verification**: Validate target versions
- **Rollback Safety**: Automatic rollback on failures
- **Audit Logging**: Track all update operations

### 2. Communication Security

- **MQTT TLS**: Encrypted communication with Symphony
- **WebSocket Security**: Secure WebSocket connections
- **API Authentication**: Secure backend API endpoints
- **Agent Isolation**: Each car agent runs in isolated environment

### 3. Data Protection

- **Metadata Encryption**: Sensitive car data encryption
- **Log Sanitization**: Remove sensitive information from logs
- **Access Control**: Role-based access to operations
- **Audit Trail**: Complete operation history

## Performance Optimization

### 1. Real-time Updates

- **WebSocket Efficiency**: Single connection for all updates
- **Selective Broadcasting**: Only send relevant updates
- **Connection Pooling**: Efficient WebSocket management
- **Message Batching**: Group related updates

### 2. Backend Performance

- **Connection Pooling**: Efficient database connections
- **Caching**: Cache frequently accessed data
- **Async Operations**: Non-blocking update operations
- **Resource Management**: Efficient memory and CPU usage

### 3. Frontend Performance

- **Component Optimization**: Efficient React rendering
- **State Management**: Optimized state updates
- **Bundle Optimization**: Minimized JavaScript bundles
- **Caching**: Browser caching for static assets

## Monitoring and Observability

### 1. System Health

- **Service Monitoring**: Backend service health checks
- **Agent Monitoring**: Ankaios agent status monitoring
- **Symphony Monitoring**: Cloud service connectivity
- **Performance Metrics**: System performance tracking

### 2. Business Metrics

- **Fleet Statistics**: Total cars, regions, versions
- **Update Success Rates**: Update success/failure rates
- **Rollout Performance**: Staged rollout success rates
- **User Activity**: Dashboard usage patterns

### 3. Alerting

- **Critical Alerts**: System failures, update failures
- **Warning Alerts**: Performance degradation, connectivity issues
- **Info Alerts**: Successful operations, status changes
- **Custom Alerts**: User-defined alert conditions

## Deployment Considerations

### 1. Production Deployment

- **Docker Containers**: Containerized deployment
- **Load Balancing**: Multiple backend instances
- **Database**: Persistent data storage
- **Monitoring**: Production monitoring setup

### 2. Scaling

- **Horizontal Scaling**: Multiple backend instances
- **Database Scaling**: Database replication and sharding
- **CDN**: Content delivery for frontend assets
- **Caching**: Redis for session and data caching

### 3. Maintenance

- **Health Checks**: Automated health monitoring
- **Log Rotation**: Automated log management
- **Backup**: Data backup and recovery
- **Updates**: Rolling updates for zero downtime

This workflow documentation provides a comprehensive understanding of how the Fleet Management Dashboard operates, from user interactions to backend processing and real-time updates. The system is designed for reliability, scalability, and ease of use in managing automotive OTA updates.
