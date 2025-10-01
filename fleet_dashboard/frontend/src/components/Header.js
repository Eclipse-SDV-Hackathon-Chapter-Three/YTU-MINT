import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

const Header = ({ isConnected, health }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                ACME Fleet Management
              </h1>
              <p className="text-sm text-gray-500">
                Symphony + Ankaios OTA Updates
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
            </div>

            {/* Health Status */}
            {health && (
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>Services:</span>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-full ${health.services?.acmeController ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
