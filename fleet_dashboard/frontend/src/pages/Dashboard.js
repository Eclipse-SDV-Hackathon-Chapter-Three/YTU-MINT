import React from 'react';
import { useQuery } from 'react-query';
import { Car, MapPin, Activity, AlertTriangle, CheckCircle, Clock, Wifi } from 'lucide-react';
import { carApi, monitoringApi } from '../services/api';
import CarGrid from '../components/CarGrid';
import StatsCard from '../components/StatsCard';
import RegionChart from '../components/RegionChart';
import StatusChart from '../components/StatusChart';

const Dashboard = () => {
  // Fetch dashboard data
  const { data: cars, isLoading: carsLoading } = useQuery('cars', carApi.getAll, {
    refetchInterval: 5000,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery('metrics', monitoringApi.getMetrics, {
    refetchInterval: 10000,
  });

  const { data: health, isLoading: healthLoading } = useQuery('health', monitoringApi.getHealth, {
    refetchInterval: 30000,
  });

  if (carsLoading || metricsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  const carsData = cars?.data?.data || [];
  const metricsData = metrics?.data?.data || {};
  const healthData = health?.data?.data || {};

  // Calculate stats
  const totalCars = carsData.length;
  const runningCars = carsData.filter(car => car.status === 'running').length;
  const updatingCars = carsData.filter(car => car.status === 'updating').length;
  const failedCars = carsData.filter(car => car.status === 'failed').length;
  const parkedCars = carsData.filter(car => car.state === 'parked').length;

  const stats = [
    {
      name: 'Total Cars',
      value: totalCars,
      icon: Car,
      color: 'blue',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Running',
      value: runningCars,
      icon: CheckCircle,
      color: 'green',
      change: `${Math.round((runningCars / totalCars) * 100)}%`,
      changeType: 'positive',
    },
    {
      name: 'Updating',
      value: updatingCars,
      icon: Clock,
      color: 'yellow',
      change: updatingCars > 0 ? 'In Progress' : 'None',
      changeType: updatingCars > 0 ? 'neutral' : 'positive',
    },
    {
      name: 'Failed',
      value: failedCars,
      icon: AlertTriangle,
      color: 'red',
      change: failedCars > 0 ? 'Needs Attention' : 'All Good',
      changeType: failedCars > 0 ? 'negative' : 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your automotive fleet and OTA update status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.name} stat={stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Region Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cars by Region</h3>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <RegionChart data={metricsData.cars?.byRegion || {}} />
        </div>

        {/* Status Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cars by Status</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <StatusChart data={metricsData.cars?.byStatus || {}} />
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <Wifi className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${healthData.services?.carManager ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">Car Manager</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${healthData.services?.ankaiosController ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">Ankaios Controller</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${healthData.services?.symphonyProvider ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">Symphony Provider</span>
          </div>
        </div>
      </div>

      {/* Recent Cars */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Cars</h3>
          <span className="text-sm text-gray-500">{totalCars} total</span>
        </div>
        <CarGrid cars={carsData.slice(0, 10)} showActions={false} />
      </div>
    </div>
  );
};

export default Dashboard;
