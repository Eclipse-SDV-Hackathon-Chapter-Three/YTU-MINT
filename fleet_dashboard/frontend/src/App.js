import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';

import Header from './components/Header';
import AcmeDashboard from './components/AcmeDashboard';

import { api } from './services/api';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  // Health check
  const { data: health, isLoading: healthLoading } = useQuery(
    'health',
    () => api.get('/health'),
    {
      refetchInterval: 30000,
      onSuccess: () => setIsConnected(true),
      onError: () => setIsConnected(false),
    }
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header 
          isConnected={isConnected}
          health={health}
        />

        {/* Main Content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<AcmeDashboard />} />
              <Route path="/acme" element={<AcmeDashboard />} />
            </Routes>
          </div>
        </main>

        {/* Connection Status */}
        {!isConnected && !healthLoading && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-2 animate-pulse"></div>
              Disconnected from server
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
