import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 5000,
    notifications: true,
    theme: 'light',
    logLevel: 'info',
    maxLogs: 100,
    updateTimeout: 300000,
    rollbackTimeout: 180000,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        autoRefresh: true,
        refreshInterval: 5000,
        notifications: true,
        theme: 'light',
        logLevel: 'info',
        maxLogs: 100,
        updateTimeout: 300000,
        rollbackTimeout: 180000,
      });
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure dashboard preferences and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <SettingsIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
          </div>

          <div className="space-y-4">
            {/* Auto Refresh */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Refresh</label>
                <p className="text-xs text-gray-500">Automatically refresh data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Refresh Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Interval (ms)
              </label>
              <select
                value={settings.refreshInterval}
                onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                className="select"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Notifications</label>
                <p className="text-xs text-gray-500">Show toast notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                className="select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
          </div>

          <div className="space-y-4">
            {/* Log Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Level
              </label>
              <select
                value={settings.logLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value }))}
                className="select"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Max Logs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Logs per Car
              </label>
              <input
                type="number"
                value={settings.maxLogs}
                onChange={(e) => setSettings(prev => ({ ...prev, maxLogs: parseInt(e.target.value) }))}
                className="input"
                min="10"
                max="1000"
              />
            </div>

            {/* Update Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Timeout (ms)
              </label>
              <input
                type="number"
                value={settings.updateTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, updateTimeout: parseInt(e.target.value) }))}
                className="input"
                min="30000"
                max="1800000"
              />
            </div>

            {/* Rollback Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rollback Timeout (ms)
              </label>
              <input
                type="number"
                value={settings.rollbackTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, rollbackTimeout: parseInt(e.target.value) }))}
                className="input"
                min="30000"
                max="1800000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Actions</h3>
            <p className="text-sm text-gray-500">Save or reset your settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
