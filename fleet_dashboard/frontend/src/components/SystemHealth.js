import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Wifi } from 'lucide-react';

const SystemHealth = ({ health }) => {
  const services = [
    {
      name: 'Car Manager',
      status: health.services?.carManager,
      description: 'Manages car lifecycle and metadata'
    },
    {
      name: 'Ankaios Controller',
      status: health.services?.ankaiosController,
      description: 'Controls Ankaios agents and workloads'
    },
    {
      name: 'Symphony Provider',
      status: health.services?.symphonyProvider,
      description: 'Handles Symphony cloud communication'
    },
    {
      name: 'WebSocket',
      status: health.services?.webSocket,
      description: 'Real-time communication'
    }
  ];

  const getStatusIcon = (status) => {
    if (status) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getOverallStatus = () => {
    const allHealthy = services.every(service => service.status);
    const someHealthy = services.some(service => service.status);
    
    if (allHealthy) return { status: 'healthy', color: 'green', icon: CheckCircle };
    if (someHealthy) return { status: 'degraded', color: 'yellow', icon: AlertTriangle };
    return { status: 'unhealthy', color: 'red', icon: XCircle };
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          overallStatus.color === 'green' ? 'bg-green-100 text-green-800' :
          overallStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {overallStatus.status.charAt(0).toUpperCase() + overallStatus.status.slice(1)}
        </div>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(service.status)}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                <p className="text-xs text-gray-500">{service.description}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${getStatusColor(service.status)}`}>
              {service.status ? 'Healthy' : 'Unhealthy'}
            </div>
          </div>
        ))}
      </div>

      {health.statistics && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {health.statistics.totalCars || 0}
              </div>
              <div className="text-xs text-gray-500">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {health.statistics.activeAgents || 0}
              </div>
              <div className="text-xs text-gray-500">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {health.statistics.connectedClients || 0}
              </div>
              <div className="text-xs text-gray-500">Connected Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(health.statistics.carsByRegion || {}).length}
              </div>
              <div className="text-xs text-gray-500">Regions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
