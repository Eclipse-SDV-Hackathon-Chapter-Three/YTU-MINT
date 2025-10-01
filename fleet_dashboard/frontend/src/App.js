import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Updates from './pages/Updates';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';
import AnkaiosRpc from './pages/AnkaiosRpc';
import AcmeDashboard from './components/AcmeDashboard';

import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection
  const { socket, lastMessage } = useWebSocket();

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

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      
      switch (data.type) {
        case 'car_created':
          toast.success(`Car ${data.data.name} created successfully`);
          break;
        case 'car_updated':
          toast.success(`Car ${data.data.name} updated`);
          break;
        case 'car_deleted':
          toast.success(`Car deleted`);
          break;
        case 'car_state_changed':
          toast.success(`Car state changed to ${data.data.newState}`);
          break;
        case 'car_status_changed':
          toast.success(`Car status changed to ${data.data.newStatus}`);
          break;
        case 'car_version_updated':
          toast.success(`Car updated to version ${data.data.newVersion}`);
          break;
        case 'update_started':
          toast.loading(`Update started for car ${data.data.carId}`, { id: `update-${data.data.carId}` });
          break;
        case 'update_completed':
          toast.success(`Update completed for car ${data.data.carId}`, { id: `update-${data.data.carId}` });
          break;
        case 'update_failed':
          toast.error(`Update failed for car ${data.data.carId}: ${data.data.error}`, { id: `update-${data.data.carId}` });
          break;
        case 'rollback_started':
          toast.loading(`Rollback started for car ${data.data.carId}`, { id: `rollback-${data.data.carId}` });
          break;
        case 'rollback_completed':
          toast.success(`Rollback completed for car ${data.data.carId}`, { id: `rollback-${data.data.carId}` });
          break;
        case 'staged_rollout_started':
          toast.success(`Staged rollout started: ${data.data.phases.join(' → ')}`);
          break;
        case 'staged_rollout_phase_completed':
          toast.success(`Phase ${data.data.phase} completed: ${data.data.results.successful}/${data.data.results.total} successful`);
          break;
        case 'staged_rollout_completed':
          toast.success('Staged rollout completed successfully');
          break;
        case 'staged_rollout_failed':
          toast.error(`Staged rollout failed at phase ${data.data.phase}: ${data.data.error}`);
          break;
        default:
          console.log('Unknown WebSocket message:', data);
      }
    }
  }, [lastMessage]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isConnected={isConnected}
            health={health}
          />

          {/* Main Content */}
          <main className="flex-1 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cars" element={<Cars />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/ankaios-rpc" element={<AnkaiosRpc />} />
                <Route path="/acme" element={<AcmeDashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
        </div>

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
