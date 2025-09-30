import React from 'react';
import { Car, MapPin, Clock, AlertTriangle, CheckCircle, Play, Pause, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const CarGrid = ({ cars, onDelete, onUpdateState, showActions = true }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'updating':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Car className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStateIcon = (state) => {
    return state === 'parked' ? (
      <Pause className="h-4 w-4 text-blue-500" />
    ) : (
      <Play className="h-4 w-4 text-purple-500" />
    );
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'running':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'updating':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'stopped':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStateBadge = (state) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    return state === 'parked' 
      ? `${baseClasses} bg-blue-100 text-blue-800`
      : `${baseClasses} bg-purple-100 text-purple-800`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cars.map((car) => (
        <div key={car.id} className="card hover:shadow-md transition-shadow duration-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">{car.name}</h3>
                <p className="text-xs text-gray-500">ID: {car.id.substring(0, 8)}</p>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onUpdateState?.(car.id, car.state === 'parked' ? 'driving' : 'parked')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={`Set to ${car.state === 'parked' ? 'driving' : 'parked'}`}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete?.(car.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete car"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Status and State */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <div className="flex items-center space-x-1">
                {getStatusIcon(car.status)}
                <span className={getStatusBadge(car.status)}>
                  {car.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">State</span>
              <div className="flex items-center space-x-1">
                {getStateIcon(car.state)}
                <span className={getStateBadge(car.state)}>
                  {car.state}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Region</span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-900">{car.region}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Version</span>
              <span className="text-xs font-medium text-gray-900">{car.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Last Updated</span>
              <span className="text-xs text-gray-500">
                {format(new Date(car.lastUpdated), 'MMM d, HH:mm')}
              </span>
            </div>
          </div>

          {/* Agent Status */}
          {car.agentStatus && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Agent</span>
                <div className="flex items-center space-x-1">
                  <div className={clsx(
                    'w-2 h-2 rounded-full',
                    car.agentStatus.status === 'running' ? 'bg-green-400' : 'bg-red-400'
                  )}></div>
                  <span className="text-xs text-gray-600">{car.agentStatus.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CarGrid;
