import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Car, MapPin, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { agentApi } from '../services/api';

const CreateCarModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const cities = ['Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt'];
  const states = ['parked', 'driving'];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await agentApi.create(data);
      toast.success('Agent created successfully');
      reset();
      onSuccess();
    } catch (error) {
      toast.error(`Failed to create agent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Create New Agent</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('city', { required: 'City is required' })}
                className="select pl-10"
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial State
            </label>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('state', { required: 'State is required' })}
                className="select pl-10"
              >
                <option value="">Select initial state</option>
                {states.map(state => (
                  <option key={state} value={state}>
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>

          {/* Note: Version is automatically assigned to ECUs */}

          {/* Custom Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Metadata (JSON)
            </label>
            <textarea
              {...register('metadata')}
              rows={3}
              className="input"
              placeholder='{"customField": "value"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional JSON metadata for the car
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Car className="h-4 w-4 mr-2" />
                  Create Car
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCarModal;
