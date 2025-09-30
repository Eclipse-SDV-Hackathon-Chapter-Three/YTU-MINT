import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const UpdateCarModal = ({ isOpen, onClose, onUpdate, cars }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];

  const onSubmit = (data) => {
    if (!selectedCar) {
      toast.error('Please select a car');
      return;
    }

    if (selectedCar.state !== 'parked') {
      toast.error('Car must be parked to receive updates');
      return;
    }

    onUpdate(selectedCar.id, data);
    onClose();
  };

  const handleClose = () => {
    setSelectedCar(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Update Car</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Car to Update
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {cars.map((car) => (
              <button
                key={car.id}
                onClick={() => setSelectedCar(car)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedCar?.id === car.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{car.name}</p>
                    <p className="text-sm text-gray-500">
                      {car.region} • {car.state} • v{car.version}
                    </p>
                  </div>
                  {car.state !== 'parked' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
          {selectedCar && selectedCar.state !== 'parked' && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  This car is currently {selectedCar.state}. Updates can only be applied when parked.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Update Form */}
        {selectedCar && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Version
              </label>
              <select
                {...register('version', { required: 'Version is required' })}
                className="select"
              >
                <option value="">Select version</option>
                {versions
                  .filter(v => v !== selectedCar.version)
                  .map(version => (
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
                className="btn btn-primary"
                disabled={selectedCar.state !== 'parked' && !selectedCar.force}
              >
                <Upload className="h-4 w-4 mr-2" />
                Update Car
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateCarModal;
