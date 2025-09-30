import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const MetricsChart = ({ metrics }) => {
  const colors = {
    running: '#10B981',
    updating: '#F59E0B',
    failed: '#EF4444',
    stopped: '#6B7280',
    parked: '#3B82F6',
    driving: '#8B5CF6'
  };

  // Prepare data for charts
  const statusData = Object.entries(metrics.cars?.byStatus || {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    color: colors[status] || '#6B7280'
  }));

  const stateData = Object.entries(metrics.cars?.byState || {}).map(([state, count]) => ({
    state: state.charAt(0).toUpperCase() + state.slice(1),
    count,
    color: colors[state] || '#6B7280'
  }));

  const regionData = Object.entries(metrics.cars?.byRegion || {}).map(([region, count]) => ({
    region,
    count,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  const versionData = Object.entries(metrics.cars?.byVersion || {}).map(([version, count]) => ({
    version,
    count,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!metrics.cars) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-500">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cars by Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State Distribution */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cars by State</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {stateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region Distribution */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cars by Region</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="region" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Version Distribution */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cars by Version</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={versionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="version" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Metrics */}
      {metrics.system && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.system.uptime / 60)}m
              </div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.system.memory.heapUsed / 1024 / 1024)}MB
              </div>
              <div className="text-sm text-gray-500">Memory Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.system.connectedClients || 0}
              </div>
              <div className="text-sm text-gray-500">Connected Clients</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;
