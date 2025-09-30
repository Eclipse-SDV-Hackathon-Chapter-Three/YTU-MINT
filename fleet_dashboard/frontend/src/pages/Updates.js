import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Upload, Download, RotateCcw, Play, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

import { carApi, updateApi } from '../services/api';
import UpdateCarModal from '../components/UpdateCarModal';
import BulkUpdateModal from '../components/BulkUpdateModal';
import StagedRolloutModal from '../components/StagedRolloutModal';
import RollbackModal from '../components/RollbackModal';

const Updates = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStagedModal, setShowStagedModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  
  const queryClient = useQueryClient();

  // Fetch cars
  const { data: cars, isLoading } = useQuery('cars', carApi.getAll, {
    refetchInterval: 5000,
  });

  // Update car mutation
  const updateCarMutation = useMutation(updateApi.updateCar, {
    onSuccess: () => {
      queryClient.invalidateQueries('cars');
      toast.success('Update initiated successfully');
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation(updateApi.bulkUpdate, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('cars');
      toast.success(`Bulk update completed: ${data.data.successful} successful, ${data.data.failed} failed`);
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });

  // Staged rollout mutation
  const stagedRolloutMutation = useMutation(updateApi.stagedRollout, {
    onSuccess: () => {
      queryClient.invalidateQueries('cars');
      toast.success('Staged rollout completed successfully');
    },
    onError: (error) => {
      toast.error(`Staged rollout failed: ${error.message}`);
    },
  });

  // Rollback mutation
  const rollbackMutation = useMutation(updateApi.rollback, {
    onSuccess: () => {
      queryClient.invalidateQueries('cars');
      toast.success('Rollback completed successfully');
    },
    onError: (error) => {
      toast.error(`Rollback failed: ${error.message}`);
    },
  });

  const handleUpdateCar = (carId, updateData) => {
    updateCarMutation.mutate({ id: carId, ...updateData });
  };

  const handleBulkUpdate = (updateData) => {
    bulkUpdateMutation.mutate(updateData);
  };

  const handleStagedRollout = (rolloutData) => {
    stagedRolloutMutation.mutate(rolloutData);
  };

  const handleRollback = (carId, rollbackData) => {
    rollbackMutation.mutate({ id: carId, ...rollbackData });
  };

  const carsData = cars?.data?.data || [];
  const parkedCars = carsData.filter(car => car.state === 'parked');
  const runningCars = carsData.filter(car => car.status === 'running');
  const updatingCars = carsData.filter(car => car.status === 'updating');

  const stats = [
    {
      name: 'Total Cars',
      value: carsData.length,
      icon: '🚗',
      color: 'blue',
    },
    {
      name: 'Parked (Ready for Update)',
      value: parkedCars.length,
      icon: '🅿️',
      color: 'green',
    },
    {
      name: 'Currently Updating',
      value: updatingCars.length,
      icon: '⏳',
      color: 'yellow',
    },
    {
      name: 'Running',
      value: runningCars.length,
      icon: '✅',
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage OTA updates for your automotive fleet
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="text-2xl mr-3">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Update Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Single Car Update */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Upload className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Update Single Car</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Update a specific car to a new version. Car must be parked.
          </p>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="btn btn-primary w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Car to Update
          </button>
        </div>

        {/* Bulk Update */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Bulk Update</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Update multiple cars at once. All cars must be parked.
          </p>
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn btn-success w-full"
            disabled={parkedCars.length === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            Update Multiple Cars
            {parkedCars.length === 0 && (
              <span className="ml-2 text-xs">(No parked cars)</span>
            )}
          </button>
        </div>

        {/* Staged Rollout */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Play className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Staged Rollout</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Roll out updates in phases (e.g., Munich → Berlin).
          </p>
          <button
            onClick={() => setShowStagedModal(true)}
            className="btn btn-warning w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Staged Rollout
          </button>
        </div>

        {/* Rollback */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <RotateCcw className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Rollback</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Roll back cars to a previous version.
          </p>
          <button
            onClick={() => setShowRollbackModal(true)}
            className="btn btn-danger w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback Cars
          </button>
        </div>
      </div>

      {/* Update History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Updates</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View All History
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Update history will appear here</p>
        </div>
      </div>

      {/* Modals */}
      <UpdateCarModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleUpdateCar}
        cars={carsData}
      />

      <BulkUpdateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onUpdate={handleBulkUpdate}
        cars={parkedCars}
      />

      <StagedRolloutModal
        isOpen={showStagedModal}
        onClose={() => setShowStagedModal(false)}
        onRollout={handleStagedRollout}
        cars={carsData}
      />

      <RollbackModal
        isOpen={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        onRollback={handleRollback}
        cars={carsData}
      />
    </div>
  );
};

export default Updates;
