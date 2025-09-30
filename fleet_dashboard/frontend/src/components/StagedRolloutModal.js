import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Play, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const StagedRolloutModal = ({ isOpen, onClose, onRollout, cars }) => {
  const [phases, setPhases] = useState(['Munich', 'Berlin']);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];
  const availableRegions = ['Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt'];

  const addPhase = () => {
    const nextRegion = availableRegions.find(region => !phases.includes(region));
    if (nextRegion) {
      setPhases([...phases, nextRegion]);
    }
  };

  const removePhase = (index) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const movePhase = (index, direction) => {
    const newPhases = [...phases];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < phases.length) {
      [newPhases[index], newPhases[newIndex]] = [newPhases[newIndex], newPhases[index]];
      setPhases(newPhases);
    }
  };

  const onSubmit = (data) => {
    if (phases.length < 2) {
      toast.error('At least 2 phases are required for staged rollout');
      return;
    }

    onRollout({
      phases,
      ...data
    });
    onClose();
  };

  const handleClose = () => {
    setPhases(['Munich', 'Berlin']);
    onClose();
  };

  // Calculate cars per phase
  const carsPerPhase = phases.map(phase => ({
    phase,
    cars: cars.filter(car => car.region === phase).length
  }));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Play className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Staged Rollout</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Phase Configuration */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              Rollout Phases
            </label>
            <button
              type="button"
              onClick={addPhase}
              className="btn btn-secondary btn-sm"
              disabled={phases.length >= availableRegions.length}
            >
              Add Phase
            </button>
          </div>

          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{phase}</p>
                    <p className="text-sm text-gray-500">
                      {carsPerPhase[index]?.cars || 0} cars in this region
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => movePhase(index, -1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhase(index, 1)}
                    disabled={index === phases.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhase(index)}
                    disabled={phases.length <= 2}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {phases.length < 2 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  At least 2 phases are required for staged rollout
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Update Configuration */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Success Threshold (0.0 - 1.0)
              </label>
              <input
                type="number"
                {...register('successThreshold', { 
                  required: 'Success threshold is required',
                  min: 0,
                  max: 1,
                  step: 0.1
                })}
                className="input"
                placeholder="0.8"
                defaultValue="0.8"
              />
              {errors.successThreshold && (
                <p className="mt-1 text-sm text-red-600">{errors.successThreshold.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wait Time Between Phases (minutes)
              </label>
              <input
                type="number"
                {...register('waitTime', { 
                  required: 'Wait time is required',
                  min: 1,
                  max: 60
                })}
                className="input"
                placeholder="5"
                defaultValue="5"
              />
              {errors.waitTime && (
                <p className="mt-1 text-sm text-red-600">{errors.waitTime.message}</p>
              )}
            </div>
          </div>

          {/* Rollout Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Rollout Preview</h4>
            <div className="space-y-2">
              {phases.map((phase, index) => (
                <div key={index} className="flex items-center text-sm text-blue-800">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <span className="font-medium">{phase}</span>
                  <span className="mx-2">({carsPerPhase[index]?.cars || 0} cars)</span>
                  {index < phases.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-blue-600 mx-2" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center text-sm text-blue-700">
              <Clock className="h-4 w-4 mr-2" />
              <span>Estimated total time: {phases.length * 5} minutes</span>
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
              className="btn btn-warning"
              disabled={phases.length < 2}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Staged Rollout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StagedRolloutModal;
