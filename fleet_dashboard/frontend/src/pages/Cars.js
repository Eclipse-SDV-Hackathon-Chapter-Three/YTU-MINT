import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { agentApi } from '../services/api';
import CarGrid from '../components/CarGrid';
import CreateCarModal from '../components/CreateCarModal';
import CarFilters from '../components/CarFilters';

const Cars = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    status: '',
    search: '',
  });
  const queryClient = useQueryClient();

  // Fetch agents with filters
  const { data: agents, isLoading, error } = useQuery(
    ['agents', filters],
    () => {
      let endpoint = '/agents';
      const params = new URLSearchParams();
      
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.status) params.append('status', filters.status);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      return agentApi.getAll();
    },
    {
      refetchInterval: 5000,
    }
  );

  // Delete agent mutation
  const deleteAgentMutation = useMutation(agentApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
      toast.success('Agent deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete agent: ${error.message}`);
    },
  });

  // Update agent state mutation
  const updateStateMutation = useMutation(
    ({ id, state }) => agentApi.updateState(id, state),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agents');
        toast.success('Agent state updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update agent state: ${error.message}`);
      },
    }
  );

  const handleDeleteAgent = (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  const handleUpdateState = (agentId, newState) => {
    updateStateMutation.mutate({ id: agentId, state: newState });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries('agents');
    toast.success('Agents list refreshed');
  };

  // Filter agents based on search term
  const filteredAgents = agents?.data?.data?.filter(agent => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        agent.id.toLowerCase().includes(searchTerm) ||
        agent.city.toLowerCase().includes(searchTerm) ||
        agent.workloads.some(workload => 
          workload.name.toLowerCase().includes(searchTerm)
        )
      );
    }
    return true;
  }) || [];

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load agents</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your automotive fleet and monitor agent status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Filters */}
      <CarFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="text-2xl font-bold text-gray-900">
            {filteredAgents.length}
          </div>
          <div className="text-sm text-gray-500">Total Agents</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {filteredAgents.filter(agent => agent.status === 'running').length}
          </div>
          <div className="text-sm text-gray-500">Running</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredAgents.filter(agent => agent.status === 'updating').length}
          </div>
          <div className="text-sm text-gray-500">Updating</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-red-600">
            {filteredAgents.filter(agent => agent.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Agents ({filteredAgents.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Export functionality would go here
                toast.info('Export functionality coming soon');
              }}
              className="btn btn-secondary btn-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">Loading agents...</span>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No agents found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Agent
            </button>
          </div>
        ) : (
          <CarGrid
            cars={filteredAgents}
            onDelete={handleDeleteAgent}
            onUpdateState={handleUpdateState}
            showActions={true}
          />
        )}
      </div>

      {/* Create Agent Modal */}
      <CreateCarModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries('cars');
        }}
      />
    </div>
  );
};

export default Cars;
