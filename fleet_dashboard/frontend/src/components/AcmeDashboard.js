import React, { useState, useEffect } from 'react';
import './AcmeDashboard.css';

const AcmeDashboard = () => {
  const [agents, setAgents] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deploymentConfig, setDeploymentConfig] = useState({
    workloadName: 'update-workload',
    image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
    version: 'v2.0'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAgents(), fetchWorkloads()]);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchAgents = async () => {
    const response = await fetch('/api/acme/agents');
    const data = await response.json();
    if (data.success) {
      setAgents(data.data);
    } else {
      throw new Error(data.error);
    }
  };

  const fetchWorkloads = async () => {
    const response = await fetch('/api/acme/workloads');
    const data = await response.json();
    if (data.success) {
      setWorkloads(data.data);
    } else {
      throw new Error(data.error);
    }
  };

  const handleAgentSelect = (agentName) => {
    setSelectedAgents(prev => 
      prev.includes(agentName) 
        ? prev.filter(name => name !== agentName)
        : [...prev, agentName]
    );
  };

  const handleDeploy = async () => {
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent');
      return;
    }

    try {
      const response = await fetch('/api/acme/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentNames: selectedAgents,
          ...deploymentConfig
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Deployment successful! Deployment ID: ${data.data.deployment.deploymentId}`);
        setSelectedAgents([]);
        fetchAgents();
        fetchWorkloads();
      } else {
        alert(`Deployment failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Deployment error: ${err.message}`);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAgents(), fetchWorkloads()]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="acme-dashboard">Loading...</div>;
  }

  return (
    <div className="acme-dashboard">
      <div className="acme-header">
        <h1>🚗 ACME Fleet Management</h1>
        <button onClick={handleRefresh} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ Error: {error}
        </div>
      )}

      <div className="acme-content">
        <div className="agents-section">
          <h2>📋 Available Agents ({agents.length})</h2>
          <div className="agents-grid">
            {agents.map(agent => (
              <div 
                key={agent.name} 
                className={`agent-card ${selectedAgents.includes(agent.name) ? 'selected' : ''}`}
                onClick={() => handleAgentSelect(agent.name)}
              >
                <div className="agent-header">
                  <h3>{agent.name}</h3>
                  <span className={`status-badge ${agent.status}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="agent-info">
                  <p><strong>Workloads:</strong> {agent.workloads}</p>
                  <p><strong>CPU Usage:</strong> {agent.cpuUsage}</p>
                  <p><strong>Free Memory:</strong> {agent.freeMemory}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="workloads-section">
          <h2>⚙️ Current Workloads ({workloads.length})</h2>
          <div className="workloads-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Agent</th>
                  <th>Runtime</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {workloads.map(workload => (
                  <tr key={workload.name}>
                    <td>{workload.name}</td>
                    <td>{workload.agent}</td>
                    <td>{workload.runtime}</td>
                    <td>
                      <span className={`state-badge ${workload.executionState.toLowerCase().includes('running') ? 'running' : 'pending'}`}>
                        {workload.executionState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="deployment-section">
          <h2>🚀 Deployment Configuration</h2>
          <div className="deployment-form">
            <div className="form-group">
              <label>Workload Name:</label>
              <input
                type="text"
                value={deploymentConfig.workloadName}
                onChange={(e) => setDeploymentConfig({...deploymentConfig, workloadName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Image:</label>
              <input
                type="text"
                value={deploymentConfig.image}
                onChange={(e) => setDeploymentConfig({...deploymentConfig, image: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Version:</label>
              <input
                type="text"
                value={deploymentConfig.version}
                onChange={(e) => setDeploymentConfig({...deploymentConfig, version: e.target.value})}
              />
            </div>
            <div className="selected-agents">
              <strong>Selected Agents ({selectedAgents.length}):</strong>
              {selectedAgents.length > 0 ? selectedAgents.join(', ') : 'None selected'}
            </div>
            <button 
              onClick={handleDeploy}
              disabled={selectedAgents.length === 0}
              className="deploy-btn"
            >
              🚀 Deploy to Selected Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcmeDashboard;
