import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Settings, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkUpdateModal = ({ isOpen, onClose, onUpdate, cars }) => {
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

    onUpdate({
      carIds: selectedCars,
      ...data
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
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Bulk Update Cars</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Car Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              Select Cars to Update ({selectedCars.length} selected)
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
                    {car.region} • {car.state} • v{car.version}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Version
              </label>
              <select
                {...register('version', { required: 'Version is required' })}
                className="select"
              >
                <option value="">Select version</option>
                {versions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
              {errors.version && (
                <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container Image (Optional)
              </label>
              <input
                type="text"
                {...register('image')}
                className="input"
                placeholder="ghcr.io/example/image:latest"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('force')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Force update (ignore state constraints)
            </label>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Update Summary</h4>
            <div className="text-sm text-blue-800">
              <p>• {selectedCars.length} cars selected for update</p>
              <p>• All selected cars are currently parked</p>
              <p>• Update will be applied to all selected cars simultaneously</p>
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
              className="btn btn-success"
              disabled={selectedCars.length === 0}
            >
              <Settings className="h-4 w-4 mr-2" />
              Update {selectedCars.length} Cars
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkUpdateModal;
