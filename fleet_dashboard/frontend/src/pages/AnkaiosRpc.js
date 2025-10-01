import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Trash2, RefreshCw, Activity, Server, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AnkaiosRpc = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    city: 'Munich',
    state: 'parked',
    image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'
  });
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents, isLoading: agentsLoading, error: agentsError } = useQuery(
    'ankaios-agents',
    () => axios.get('/api/ankaios/agents').then(res => res.data),
    {
      refetchInterval: 5000,
    }
  );

  // Fetch system status
  const { data: status, isLoading: statusLoading } = useQuery(
    'ankaios-status',
    () => axios.get('/api/ankaios/status').then(res => res.data),
    {
      refetchInterval: 10000,
    }
  );

  // Create agent mutation
  const createAgentMutation = useMutation(
    (agentData) => axios.post('/api/ankaios/agents', agentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ankaios-agents');
        queryClient.invalidateQueries('ankaios-status');
        toast.success('Ankaios agent created successfully');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          city: 'Munich',
          state: 'parked',
          image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'
        });
      },
      onError: (error) => {
        toast.error(`Failed to create agent: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  // Delete agent mutation
  const deleteAgentMutation = useMutation(
    (agentId) => axios.delete(`/api/ankaios/agents/${agentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ankaios-agents');
        queryClient.invalidateQueries('ankaios-status');
        toast.success('Agent deleted successfully');
      },
      onError: (error) => {
        toast.error(`Failed to delete agent: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  // Cleanup mutation
  const cleanupMutation = useMutation(
    () => axios.post('/api/ankaios/cleanup'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ankaios-agents');
        queryClient.invalidateQueries('ankaios-status');
        toast.success('All agents cleaned up');
      },
      onError: (error) => {
        toast.error(`Failed to cleanup: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  const handleCreateAgent = (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    createAgentMutation.mutate(createForm);
  };

  const handleDeleteAgent = (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  const handleCleanup = () => {
    if (window.confirm('Are you sure you want to cleanup all agents?')) {
      cleanupMutation.mutate();
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries('ankaios-agents');
    queryClient.invalidateQueries('ankaios-status');
    toast.success('Data refreshed');
  };

  if (agentsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load Ankaios agents</div>
        <button
          onClick={handleRefresh}
          className="btn btn-primary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ankaios RPC Controller</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage Ankaios agents using RPC communication
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={agentsLoading || statusLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${agentsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCleanup}
            className="btn btn-red"
            disabled={cleanupMutation.isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup All
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </button>
        </div>
      </div>

      {/* System Status */}
      {status && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agents?.data?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">System Status</p>
                <p className="text-sm font-bold text-green-600">
                  {status.data?.success ? 'Healthy' : 'Error'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Controller</p>
                <p className="text-sm font-bold text-purple-600">
                  {status.data?.controller ? 'Ready' : 'Not Ready'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Ankaios Agents ({agents?.data?.length || 0})
          </h3>
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">Loading agents...</span>
          </div>
        ) : !agents?.data?.length ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No Ankaios agents found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.data.map((agent) => (
              <div key={agent.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Server className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{agent.name}</h4>
                      <p className="text-xs text-gray-500">ID: {agent.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">City</span>
                    <span className="text-xs font-medium text-gray-900">{agent.config?.city || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">State</span>
                    <span className="text-xs font-medium text-gray-900">{agent.config?.state || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Created</span>
                    <span className="text-xs text-gray-500">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Create Ankaios Agent</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="input"
                  placeholder="Enter agent name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  value={createForm.city}
                  onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
                  className="select"
                >
                  <option value="Munich">Munich</option>
                  <option value="Berlin">Berlin</option>
                  <option value="Hamburg">Hamburg</option>
                  <option value="Cologne">Cologne</option>
                  <option value="Frankfurt">Frankfurt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial State
                </label>
                <select
                  value={createForm.state}
                  onChange={(e) => setCreateForm({...createForm, state: e.target.value})}
                  className="select"
                >
                  <option value="parked">Parked</option>
                  <option value="driving">Driving</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Container Image
                </label>
                <input
                  type="text"
                  value={createForm.image}
                  onChange={(e) => setCreateForm({...createForm, image: e.target.value})}
                  className="input"
                  placeholder="Container image URL"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={createAgentMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createAgentMutation.isLoading}
                >
                  {createAgentMutation.isLoading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnkaiosRpc;
