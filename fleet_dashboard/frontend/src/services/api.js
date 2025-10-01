import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Agent API (new agent-based system)
export const agentApi = {
  getAll: () => api.get('/agents'),
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  updateState: (id, state) => api.put(`/agents/${id}/state`, { state }),
  updateStatus: (id, status) => api.put(`/agents/${id}/status`, { status }),
  updateWorkloadVersion: (id, workloadName, newVersion) => 
    api.put(`/agents/${id}/workloads/${workloadName}/version`, { newVersion }),
  addWorkload: (id, workload) => api.post(`/agents/${id}/workloads`, workload),
  removeWorkload: (id, workloadName) => api.delete(`/agents/${id}/workloads/${workloadName}`),
  delete: (id) => api.delete(`/agents/${id}`),
  getByCity: (city) => api.get(`/agents/city/${city}`),
  getByState: (state) => api.get(`/agents/state/${state}`),
  getStats: () => api.get('/agents/stats/overview'),
  exportData: () => api.get('/agents/export/data'),
};

// Car API (legacy - for backward compatibility)
export const carApi = {
  getAll: () => agentApi.getAll(), // Redirect to agents
  getById: (id) => agentApi.getById(id),
  create: (data) => agentApi.create(data),
  updateState: (id, state) => agentApi.updateState(id, state),
  delete: (id) => agentApi.delete(id),
  getByRegion: (region) => agentApi.getByCity(region), // Map region to city
  getByState: (state) => agentApi.getByState(state),
  getByStatus: (status) => agentApi.getByState(status), // Map status to state
  getStats: () => agentApi.getStats(),
};

// Update API
export const updateApi = {
  updateCar: (id, data) => api.post(`/updates/${id}`, data),
  bulkUpdate: (data) => api.post('/updates/bulk', data),
  stagedRollout: (data) => api.post('/updates/staged-rollout', data),
  rollback: (id, data) => api.post(`/updates/${id}/rollback`, data),
  getHistory: (id) => api.get(`/updates/${id}/history`),
};

// Monitoring API
export const monitoringApi = {
  getLogs: (id, params = {}) => api.get(`/monitoring/${id}/logs`, { params }),
  getStatus: (id) => api.get(`/monitoring/${id}/status`),
  getAgent: (id) => api.get(`/monitoring/${id}/agent`),
  getAllAgents: () => api.get('/monitoring/agents/all'),
  getHealth: () => api.get('/monitoring/health'),
  getMetrics: () => api.get('/monitoring/metrics'),
  getWebSocketClients: () => api.get('/monitoring/websocket/clients'),
  refreshCar: (id) => api.post(`/monitoring/${id}/refresh`),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
