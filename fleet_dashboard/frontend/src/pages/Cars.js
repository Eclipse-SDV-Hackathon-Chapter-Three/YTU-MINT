import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { carApi } from '../services/api';
import CarGrid from '../components/CarGrid';
import CreateCarModal from '../components/CreateCarModal';
import CarFilters from '../components/CarFilters';

const Cars = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    state: '',
    status: '',
    search: '',
  });
  const queryClient = useQueryClient();

  // Fetch cars with filters
  const { data: cars, isLoading, error } = useQuery(
    ['cars', filters],
    () => {
      let endpoint = '/cars';
      const params = new URLSearchParams();
      
      if (filters.region) params.append('region', filters.region);
      if (filters.state) params.append('state', filters.state);
      if (filters.status) params.append('status', filters.status);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      return carApi.getAll();
    },
    {
      refetchInterval: 5000,
    }
  );

  // Delete car mutation
  const deleteCarMutation = useMutation(carApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('cars');
      toast.success('Car deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete car: ${error.message}`);
    },
  });

  // Update car state mutation
  const updateStateMutation = useMutation(
    ({ id, state }) => carApi.updateState(id, state),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cars');
        toast.success('Car state updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update car state: ${error.message}`);
      },
    }
  );

  const handleDeleteCar = (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      deleteCarMutation.mutate(carId);
    }
  };

  const handleUpdateState = (carId, newState) => {
    updateStateMutation.mutate({ id: carId, state: newState });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries('cars');
    toast.success('Cars list refreshed');
  };

  // Filter cars based on search term
  const filteredCars = cars?.data?.data?.filter(car => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        car.name.toLowerCase().includes(searchTerm) ||
        car.id.toLowerCase().includes(searchTerm) ||
        car.region.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  }) || [];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load cars</div>
        <button
          onClick={handleRefresh}
          className="btn btn-primary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your automotive fleet and monitor car status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </button>
        </div>
      </div>

      {/* Filters */}
      <CarFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="text-2xl font-bold text-gray-900">
            {filteredCars.length}
          </div>
          <div className="text-sm text-gray-500">Total Cars</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {filteredCars.filter(car => car.status === 'running').length}
          </div>
          <div className="text-sm text-gray-500">Running</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredCars.filter(car => car.status === 'updating').length}
          </div>
          <div className="text-sm text-gray-500">Updating</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-red-600">
            {filteredCars.filter(car => car.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Cars ({filteredCars.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Export functionality would go here
                toast.info('Export functionality coming soon');
              }}
              className="btn btn-secondary btn-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">Loading cars...</span>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No cars found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Car
            </button>
          </div>
        ) : (
          <CarGrid
            cars={filteredCars}
            onDelete={handleDeleteCar}
            onUpdateState={handleUpdateState}
            showActions={true}
          />
        )}
      </div>

      {/* Create Car Modal */}
      <CreateCarModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries('cars');
        }}
      />
    </div>
  );
};

export default Cars;
