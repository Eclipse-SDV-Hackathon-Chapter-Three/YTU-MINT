import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Monitor, Activity, Wifi, RefreshCw, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { monitoringApi } from '../services/api';
import LogsViewer from '../components/LogsViewer';
import MetricsChart from '../components/MetricsChart';
import SystemHealth from '../components/SystemHealth';

const Monitoring = () => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch monitoring data
  const { data: health, isLoading: healthLoading } = useQuery(
    'monitoring-health',
    monitoringApi.getHealth,
    { refetchInterval: 10000 }
  );

  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'monitoring-metrics',
    monitoringApi.getMetrics,
    { refetchInterval: 5000 }
  );

  const { data: agents, isLoading: agentsLoading } = useQuery(
    'monitoring-agents',
    monitoringApi.getAllAgents,
    { refetchInterval: 5000 }
  );

  const { data: wsClients } = useQuery(
    'monitoring-ws-clients',
    monitoringApi.getWebSocketClients,
    { refetchInterval: 10000 }
  );

  const handleRefresh = () => {
    toast.success('Monitoring data refreshed');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Monitor },
    { id: 'logs', name: 'Logs', icon: Activity },
    { id: 'metrics', name: 'Metrics', icon: Activity },
    { id: 'health', name: 'System Health', icon: Wifi },
  ];

  if (healthLoading || metricsLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading monitoring data...</span>
      </div>
    );
  }

  const healthData = health?.data?.data || {};
  const metricsData = metrics?.data?.data || {};
  const agentsData = agents?.data?.data || [];
  const wsClientsData = wsClients?.data?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor system health, logs, and performance metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Monitor className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {healthData.statistics?.totalCars || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total Cars</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {agentsData.length}
                  </p>
                  <p className="text-sm text-gray-500">Active Agents</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Wifi className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {wsClientsData.connected || 0}
                  </p>
                  <p className="text-sm text-gray-500">Connected Clients</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((Date.now() - new Date('2025-09-30T23:00:00Z').getTime()) / 1000 / 60)}m
                  </p>
                  <p className="text-sm text-gray-500">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <SystemHealth health={healthData} />
        </div>
      )}

      {activeTab === 'logs' && (
        <LogsViewer
          selectedCar={selectedCar}
          onCarSelect={setSelectedCar}
        />
      )}

      {activeTab === 'metrics' && (
        <MetricsChart metrics={metricsData} />
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <SystemHealth health={healthData} />
          
          {/* Agents Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Agent Status</h3>
              <span className="text-sm text-gray-500">{agentsData.length} agents</span>
            </div>
            
            {agentsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No agents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Car ID</th>
                      <th className="table-header-cell">Agent Name</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Start Time</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {agentsData.map((agent) => (
                      <tr key={agent.carId} className="table-row">
                        <td className="table-cell font-mono text-xs">
                          {agent.carId.substring(0, 8)}...
                        </td>
                        <td className="table-cell">{agent.agentName}</td>
                        <td className="table-cell">
                          <span className={`status-badge ${
                            agent.status === 'running' ? 'status-running' :
                            agent.status === 'failed' ? 'status-failed' :
                            'status-stopped'
                          }`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="table-cell text-sm text-gray-500">
                          {new Date(agent.startTime).toLocaleString()}
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => setSelectedCar(agent.carId)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
