import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Filter, Download, RefreshCw, Eye, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { monitoringApi, carApi } from '../services/api';

const LogsViewer = ({ selectedCar, onCarSelect }) => {
  const [filters, setFilters] = useState({
    level: '',
    search: '',
  });

  // Fetch cars for selection
  const { data: cars } = useQuery('cars', carApi.getAll);

  // Fetch logs for selected car
  const { data: logs, isLoading, error } = useQuery(
    ['logs', selectedCar, filters],
    () => monitoringApi.getLogs(selectedCar, {
      limit: 100,
      level: filters.level || undefined
    }),
    {
      enabled: !!selectedCar,
      refetchInterval: 5000,
    }
  );

  const handleLevelFilter = (level) => {
    setFilters(prev => ({
      ...prev,
      level: level === prev.level ? '' : level
    }));
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredLogs = logs?.data?.data?.filter(log => {
    if (filters.search) {
      return log.message.toLowerCase().includes(filters.search.toLowerCase());
    }
    return true;
  }) || [];

  const carsData = cars?.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Car Selection */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Select Car</h3>
          <span className="text-sm text-gray-500">{carsData.length} cars available</span>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {carsData.map((car) => (
            <button
              key={car.id}
              onClick={() => onCarSelect(car.id)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedCar === car.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{car.name}</p>
                  <p className="text-sm text-gray-500">{car.region} • {car.status}</p>
                </div>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedCar && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Log Filters</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(`/api/monitoring/${selectedCar}/logs?format=download`)}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Logs
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="input pl-10"
                    placeholder="Search log messages..."
                  />
                </div>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Log Level
                </label>
                <div className="flex space-x-2">
                  {['error', 'warn', 'info', 'debug'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleLevelFilter(level)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                        filters.level === level
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Logs ({filteredLogs.length})
              </h3>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-gray-600">Loading logs...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-600 mb-2">Failed to load logs</p>
                <p className="text-sm text-gray-500">{error.message}</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No logs found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{log.message}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-medium">
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LogsViewer;
