import React, { useState, useEffect } from 'react';
import './AcmeDashboard.css';

const AcmeDashboard = () => {
  const [agents, setAgents] = useState([]);
  const [agentWorkloads, setAgentWorkloads] = useState({});
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Predefined ECU workloads
  const predefinedWorkloads = [
    {
      id: 'ecu-powertrain',
      name: 'ECU Powertrain',
      description: 'Engine control and powertrain management',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v2.1',
      category: 'Critical',
      ports: [8080]
    },
    {
      id: 'ecu-infotainment',
      name: 'ECU Infotainment',
      description: 'Entertainment and navigation system',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v1.8',
      category: 'User Interface',
      ports: [8081]
    },
    {
      id: 'ecu-chassis',
      name: 'ECU Chassis',
      description: 'Suspension and stability control',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v3.0',
      category: 'Safety',
      ports: [8082]
    },
    {
      id: 'ecu-body',
      name: 'ECU Body',
      description: 'Body control and lighting systems',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v2.5',
      category: 'Comfort',
      ports: [8083]
    },
    {
      id: 'ecu-safety',
      name: 'ECU Safety',
      description: 'Airbag and safety systems',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v4.0',
      category: 'Safety',
      ports: [8084]
    },
    {
      id: 'ecu-adas',
      name: 'ECU ADAS',
      description: 'Advanced driver assistance systems',
      image: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest',
      version: 'v2.3',
      category: 'Autonomous',
      ports: [8085]
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAgents();
        await fetchAllWorkloads();
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

  const fetchAllWorkloads = async () => {
    const response = await fetch('/api/acme/workloads');
    const data = await response.json();
    if (data.success) {
      // Group workloads by agent
      const workloadsByAgent = {};
      data.data.forEach(workload => {
        if (!workloadsByAgent[workload.agent]) {
          workloadsByAgent[workload.agent] = [];
        }
        workloadsByAgent[workload.agent].push(workload);
      });
      setAgentWorkloads(workloadsByAgent);
    } else {
      throw new Error(data.error);
    }
  };

  const handleWorkloadSelect = (workload) => {
    setSelectedWorkload(workload);
    setSelectedAgents([]); // Reset agent selection when workload changes
  };

  const handleAgentSelect = (agentName) => {
    if (!selectedWorkload) {
      alert('Please select a workload first');
      return;
    }
    setSelectedAgents(prev => 
      prev.includes(agentName) 
        ? prev.filter(name => name !== agentName)
        : [...prev, agentName]
    );
  };

  const handleDeploy = async () => {
    if (!selectedWorkload) {
      alert('Please select a workload first');
      return;
    }
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
          workloadName: selectedWorkload.id,
          image: selectedWorkload.image,
          version: selectedWorkload.version,
          env: {
            ECU_TYPE: selectedWorkload.id,
            ECU_CATEGORY: selectedWorkload.category,
            PORTS: selectedWorkload.ports.join(',')
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Deployment successful! Deployment ID: ${data.data.deployment.deploymentId}`);
        setSelectedAgents([]);
        setSelectedWorkload(null);
        fetchAgents();
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
      await fetchAgents();
      await fetchAllWorkloads();
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
                  <p><strong>CPU Usage:</strong> {agent.cpuUsage}</p>
                  <p><strong>Free Memory:</strong> {agent.freeMemory}</p>
                  <p><strong>Running Workloads:</strong> {agent.workloads}</p>
                </div>
                
                {/* Show running workloads for this agent */}
                {agentWorkloads[agent.name] && agentWorkloads[agent.name].length > 0 && (
                  <div className="agent-workloads">
                    <h4>Currently Running:</h4>
                    <div className="workload-list">
                      {agentWorkloads[agent.name].map(workload => (
                        <div key={workload.name} className="running-workload">
                          <span className="workload-name">{workload.name}</span>
                          <span className={`workload-state ${workload.executionState.toLowerCase().includes('running') ? 'running' : 'pending'}`}>
                            {workload.executionState}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="workloads-section">
          <h2>⚙️ Available ECU Workloads</h2>
          <div className="workloads-grid">
            {predefinedWorkloads.map(workload => (
              <div 
                key={workload.id} 
                className={`workload-card ${selectedWorkload?.id === workload.id ? 'selected' : ''}`}
                onClick={() => handleWorkloadSelect(workload)}
              >
                <div className="workload-header">
                  <h3>{workload.name}</h3>
                  <span className={`category-badge ${workload.category.toLowerCase().replace(' ', '-')}`}>
                    {workload.category}
                  </span>
                </div>
                <div className="workload-info">
                  <p className="workload-description">{workload.description}</p>
                  <div className="workload-details">
                    <p><strong>Version:</strong> {workload.version}</p>
                    <p><strong>Ports:</strong> {workload.ports.join(', ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="deployment-section">
          <h2>🚀 Deployment Configuration</h2>
          <div className="deployment-form">
            <div className="selected-workload">
              <strong>Selected Workload:</strong>
              {selectedWorkload ? (
                <div className="selected-workload-info">
                  <h4>{selectedWorkload.name}</h4>
                  <p>{selectedWorkload.description}</p>
                  <div className="workload-meta">
                    <span>Version: {selectedWorkload.version}</span>
                    <span>Category: {selectedWorkload.category}</span>
                    <span>Ports: {selectedWorkload.ports.join(', ')}</span>
                  </div>
                </div>
              ) : (
                <span className="no-selection">No workload selected</span>
              )}
            </div>
            
            <div className="selected-agents">
              <strong>Selected Agents ({selectedAgents.length}):</strong>
              {selectedAgents.length > 0 ? (
                <div className="selected-agents-list">
                  {selectedAgents.map(agentName => (
                    <span key={agentName} className="agent-tag">
                      {agentName}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="no-selection">
                  {selectedWorkload ? 'No agents selected' : 'Select a workload first'}
                </span>
              )}
            </div>
            
            <button 
              onClick={handleDeploy}
              disabled={!selectedWorkload || selectedAgents.length === 0}
              className="deploy-btn"
            >
              🚀 Deploy {selectedWorkload?.name || 'Workload'} to {selectedAgents.length} Agent{selectedAgents.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcmeDashboard;
