import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, RotateCcw, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const RollbackModal = ({ isOpen, onClose, onRollback, cars }) => {
  const [selectedCars, setSelectedCars] = useState([]);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];

  const handleCarSelect = (carId) => {
    setSelectedCars(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCars.length === cars.length) {
      setSelectedCars([]);
    } else {
      setSelectedCars(cars.map(car => car.id));
    }
  };

  const onSubmit = (data) => {
    if (selectedCars.length === 0) {
      toast.error('Please select at least one car');
      return;
    }

    selectedCars.forEach(carId => {
      onRollback(carId, data);
    });
    onClose();
  };

  const handleClose = () => {
    setSelectedCars([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <RotateCcw className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Rollback Cars</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Rollback Warning</h4>
              <p className="text-sm text-red-800 mt-1">
                Rolling back will revert cars to a previous version. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Car Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              Select Cars to Rollback ({selectedCars.length} selected)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn btn-secondary btn-sm"
            >
              {selectedCars.length === cars.length ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {cars.map((car) => (
              <label
                key={car.id}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCars.includes(car.id)}
                  onChange={() => handleCarSelect(car.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">{car.name}</p>
                  <p className="text-sm text-gray-500">
                    {car.region} • {car.state} • Current: v{car.version}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rollback Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Version
              </label>
              <select
                {...register('targetVersion', { required: 'Target version is required' })}
                className="select"
              >
                <option value="">Select version to rollback to</option>
                {versions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
              {errors.targetVersion && (
                <p className="mt-1 text-sm text-red-600">{errors.targetVersion.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rollback Reason
              </label>
              <input
                type="text"
                {...register('reason')}
                className="input"
                placeholder="e.g., Critical bug found"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-2">Rollback Summary</h4>
            <div className="text-sm text-red-800">
              <p>• {selectedCars.length} cars selected for rollback</p>
              <p>• All selected cars will be reverted to the target version</p>
              <p>• This action will stop current workloads and restart with previous version</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={selectedCars.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback {selectedCars.length} Cars
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RollbackModal;
