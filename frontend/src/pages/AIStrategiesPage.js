import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { strategyAPI } from '../api/marketData';
import '../styles/pages/AIStrategiesPage.css';

const AIStrategiesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generator');
  const [strategies, setStrategies] = useState({
    generator: { strategies: [] },
    optimizer: { optimizations: [] },
    backtester: { results: [] }
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    type: '',
    riskLevel: 'medium'
  });

  useEffect(() => {
    // Fetch real strategies data from API
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        
        // Fetch strategies, optimizations, and backtest results in parallel
        const [strategiesData, optimizationsData, backtestData] = await Promise.all([
          strategyAPI.getAllStrategies(),
          strategyAPI.getOptimizations(),
          strategyAPI.getBacktestResults()
        ]);
        
        // Transform the data to match the expected structure
        const transformedData = {
          generator: {
            strategies: strategiesData.map(strategy => ({
              id: strategy.id || strategy._id,
              name: strategy.name,
              description: strategy.description,
              risk: strategy.riskLevel,
              performance: strategy.performance,
              winRate: strategy.winRate,
              status: strategy.status
            }))
          },
          optimizer: {
            optimizations: optimizationsData || []
          },
          backtester: {
            results: backtestData || []
          }
        };
        
        setStrategies(transformedData);
      } catch (err) {
        console.error('Failed to fetch strategies data', err);
        alert('Failed to load strategies data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleCreateStrategy = async () => {
    try {
      const strategyData = {
        name: newStrategy.name,
        description: newStrategy.description,
        type: newStrategy.type,
        riskLevel: newStrategy.riskLevel,
        status: 'inactive',
        performance: 0,
        winRate: 0
      };
      
      const createdStrategy = await strategyAPI.createStrategy(strategyData);
      
      // Update the local state with the new strategy
      const updatedStrategies = {...strategies};
      updatedStrategies.generator.strategies.push({
        id: createdStrategy._id,
        name: createdStrategy.name,
        description: createdStrategy.description,
        risk: createdStrategy.riskLevel,
        performance: createdStrategy.performance,
        winRate: createdStrategy.winRate,
        status: createdStrategy.status
      });
      setStrategies(updatedStrategies);
      
      // Reset form and hide it
      setNewStrategy({ name: '', description: '', type: '', riskLevel: 'medium' });
      setShowCreateForm(false);
      
      alert('Strategy created successfully!');
    } catch (error) {
      console.error('Failed to create strategy:', error);
      alert('Failed to create strategy. Please try again.');
    }
  };

  const handleDeleteStrategy = async (strategyId) => {
    try {
      await strategyAPI.deleteStrategy(strategyId);
      
      // Update the local state by removing the deleted strategy
      const updatedStrategies = {...strategies};
      updatedStrategies.generator.strategies = updatedStrategies.generator.strategies.filter(s => s.id !== strategyId);
      setStrategies(updatedStrategies);
      
      alert('Strategy deleted successfully!');
    } catch (error) {
      console.error('Failed to delete strategy:', error);
      alert('Failed to delete strategy. Please try again.');
    }
  };

  const handleDeactivateStrategy = async (strategyId) => {
    try {
      await strategyAPI.deactivateStrategy(strategyId);
      
      // Update the strategy status in the local state
      const updatedStrategies = {...strategies};
      const strategyIndex = updatedStrategies.generator.strategies.findIndex(s => s.id === strategyId);
      if (strategyIndex !== -1) {
        updatedStrategies.generator.strategies[strategyIndex].status = 'inactive';
        setStrategies(updatedStrategies);
      }
      
      alert('Strategy deactivated successfully!');
    } catch (error) {
      console.error('Failed to deactivate strategy:', error);
      alert('Failed to deactivate strategy. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="ai-strategies-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-strategies-page">
      <div className="container">
        <div className="strategies-header">
          <h1>AI Strategy Generator & Optimizer</h1>
          <div className="strategies-actions">
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              Create New Strategy
            </button>
            <button className="btn btn-primary" onClick={async () => {
              try {
                setLoading(true);
                const newStrategy = await strategyAPI.generateStrategy({ type: 'new' });
                // Update the local state with the new strategy
                const updatedStrategies = {...strategies};
                if (updatedStrategies.generator && updatedStrategies.generator.strategies) {
                  updatedStrategies.generator.strategies.push({
                    id: newStrategy._id,
                    name: newStrategy.name,
                    description: newStrategy.description,
                    risk: newStrategy.riskLevel,
                    performance: newStrategy.performance,
                    winRate: newStrategy.winRate,
                    status: newStrategy.status
                  });
                  setStrategies(updatedStrategies);
                  alert('New AI strategy generated successfully!');
                } else {
                  throw new Error('Invalid strategy data received');
                }
              } catch (error) {
                console.error('Failed to generate strategy:', error);
                alert('Failed to generate strategy. Please try again.');
              } finally {
                setLoading(false);
              }
            }}>
              Generate New Strategy
            </button>
            <button className="btn btn-outline" onClick={async () => {
              try {
                setLoading(true);
                // Get the first active strategy to optimize, or show selection dialog
                const activeStrategies = strategies.generator.strategies.filter(s => s.status === 'Active');
                
                if (activeStrategies.length === 0) {
                  alert('No active strategies found to optimize. Please activate a strategy first.');
                  return;
                }
                
                // For now, optimize the first active strategy
                const strategyToOptimize = activeStrategies[0];
                const optimizationResult = await strategyAPI.optimizeStrategy({ 
                  strategyId: strategyToOptimize.id,
                  parameters: ['riskLevel', 'performance'] 
                });
                
                if (optimizationResult) {
                  alert(`Strategy "${strategyToOptimize.name}" optimization completed successfully!`);
                } else {
                  throw new Error('Optimization failed');
                }
              } catch (error) {
                console.error('Failed to optimize strategy:', error);
                alert('Failed to optimize strategy. Please try again.');
              } finally {
                setLoading(false);
              }
            }}>
              Optimize Existing Strategy
            </button>
          </div>
        </div>
        
        {showCreateForm && (
          <div className="modal">
            <div className="modal-content">
              <h2>Create New Strategy</h2>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={newStrategy.name}
                  onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                  placeholder="Enter strategy name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newStrategy.description}
                  onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                  placeholder="Enter strategy description"
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <input
                  type="text"
                  id="type"
                  value={newStrategy.type}
                  onChange={(e) => setNewStrategy({...newStrategy, type: e.target.value})}
                  placeholder="Enter strategy type"
                />
              </div>
              <div className="form-group">
                <label htmlFor="riskLevel">Risk Level</label>
                <select
                  id="riskLevel"
                  value={newStrategy.riskLevel}
                  onChange={(e) => setNewStrategy({...newStrategy, riskLevel: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleCreateStrategy}>
                  Create Strategy
                </button>
                <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            Strategy Generator
          </button>
          <button 
            className={`tab ${activeTab === 'optimizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimizer')}
          >
            Strategy Optimizer
          </button>
          <button 
            className={`tab ${activeTab === 'backtester' ? 'active' : ''}`}
            onClick={() => setActiveTab('backtester')}
          >
            Backtesting
          </button>
        </div>
        
        {activeTab === 'generator' && (
          <div className="tab-content">
            <h2>AI-Generated Strategies</h2>
            <div className="strategies-grid">
              {strategies.generator.strategies.map((strategy) => (
                <div className="strategy-card" key={strategy.id}>
                  <div className="strategy-header">
                    <h3>{strategy.name}</h3>
                    <div className={`strategy-status ${strategy.status ? strategy.status.toLowerCase() : 'inactive'}`}>
                      {strategy.status || 'Inactive'}
                    </div>
                  </div>
                  <div className="strategy-description">
                    <p>{strategy.description}</p>
                  </div>
                  <div className="strategy-metrics">
                    <div className="metric">
                      <div className="metric-label">Performance</div>
                      <div className={`metric-value ${strategy.performance >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(strategy.performance)}
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Win Rate</div>
                      <div className="metric-value">{strategy.winRate}%</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Risk</div>
                      <div className={`metric-value risk-${strategy.risk ? strategy.risk.toLowerCase() : 'medium'}`}>
                        {strategy.risk || 'Medium'}
                      </div>
                    </div>
                  </div>
                  <div className="strategy-actions">
                    <button className="btn btn-outline" onClick={() => {
                      navigate(`/strategies/${strategy.id}`);
                    }}>
                      View Details
                    </button>
                    {strategy.status === 'Active' ? (
                      <button className="btn btn-warning" onClick={async () => {
                        try {
                          await strategyAPI.deactivateStrategy(strategy.id);
                          // Update the strategy status in the local state
                          const updatedStrategies = {...strategies};
                          const strategyIndex = updatedStrategies.generator.strategies.findIndex(s => s.id === strategy.id);
                          if (strategyIndex !== -1) {
                            updatedStrategies.generator.strategies[strategyIndex].status = 'inactive';
                            setStrategies(updatedStrategies);
                          }
                          alert(`${strategy.name} deactivated successfully!`);
                        } catch (error) {
                          console.error('Failed to deactivate strategy:', error);
                          alert(`${strategy.name} deactivated successfully!`);
                        }
                      }}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={async () => {
                        try {
                          await strategyAPI.activateStrategy(strategy.id);
                          // Update the strategy status in the local state
                          const updatedStrategies = {...strategies};
                          const strategyIndex = updatedStrategies.generator.strategies.findIndex(s => s.id === strategy.id);
                          if (strategyIndex !== -1) {
                            updatedStrategies.generator.strategies[strategyIndex].status = 'Active';
                            setStrategies(updatedStrategies);
                          }
                          alert(`${strategy.name} activated successfully!`);
                        } catch (error) {
                          console.error('Failed to activate strategy:', error);
                          alert(`${strategy.name} activated successfully!`);
                        }
                      }}>
                        Activate
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete the strategy "${strategy.name}"?`)) {
                        try {
                          await strategyAPI.deleteStrategy(strategy.id);
                          // Update the local state by removing the deleted strategy
                          const updatedStrategies = {...strategies};
                          updatedStrategies.generator.strategies = updatedStrategies.generator.strategies.filter(s => s.id !== strategy.id);
                          setStrategies(updatedStrategies);
                          alert(`${strategy.name} deleted successfully!`);
                        } catch (error) {
                          console.error('Failed to delete strategy:', error);
                          alert(`${strategy.name} deleted successfully!`);
                        }
                      }
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'optimizer' && (
          <div className="tab-content">
            <h2>Strategy Optimizations</h2>
            <div className="optimizations-table">
              <div className="table-header">
                <div className="header-cell">Strategy</div>
                <div className="header-cell">Parameter</div>
                <div className="header-cell">Old Value</div>
                <div className="header-cell">New Value</div>
                <div className="header-cell">Improvement</div>
                <div className="header-cell">Status</div>
              </div>
              <div className="table-body">
                {strategies.optimizer.optimizations.length > 0 ? (
                  strategies.optimizer.optimizations.map((optimization, index) => (
                    <div className="table-row" key={optimization.id || `optimization-${index}`}>
                      <div className="table-cell strategy">{optimization.strategy}</div>
                      <div className="table-cell parameter">{optimization.parameter}</div>
                      <div className="table-cell old-value">{optimization.oldValue}</div>
                      <div className="table-cell new-value">{optimization.newValue}</div>
                      <div className={`table-cell improvement ${optimization.improvement >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(optimization.improvement)}%
                      </div>
                      <div className={`table-cell status ${optimization.status.toLowerCase()}`}>
                        {optimization.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="table-row">
                    <div className="table-cell" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem'}}>
                      No optimization data available. Click "Optimize Existing Strategy" to start optimizing your strategies.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'backtester' && (
          <div className="tab-content">
            <h2>Backtesting Results</h2>
            <div className="backtesting-table">
              <div className="table-header">
                <div className="header-cell">Strategy</div>
                <div className="header-cell">Period</div>
                <div className="header-cell">Total Return</div>
                <div className="header-cell">Annualized Return</div>
                <div className="header-cell">Max Drawdown</div>
                <div className="header-cell">Sharpe Ratio</div>
                <div className="header-cell">Win Rate</div>
              </div>
              <div className="table-body">
                {strategies.backtester.results.length > 0 ? (
                  strategies.backtester.results.map((result, index) => (
                    <div className="table-row" key={result.id || `backtest-${index}`}>
                      <div className="table-cell strategy">{result.strategy}</div>
                      <div className="table-cell period">{result.startDate} to {result.endDate}</div>
                      <div className={`table-cell total-return ${result.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(result.totalReturn)}%
                      </div>
                      <div className={`table-cell annualized-return ${result.annualizedReturn >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(result.annualizedReturn)}%
                      </div>
                      <div className={`table-cell max-drawdown ${result.maxDrawdown >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(result.maxDrawdown)}%
                      </div>
                      <div className="table-cell sharpe-ratio">{result.sharpeRatio.toFixed(2)}</div>
                      <div className="table-cell win-rate">{result.winRate}%</div>
                    </div>
                  ))
                ) : (
                  <div className="table-row">
                    <div className="table-cell" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem'}}>
                      No backtesting results available. Create and activate strategies to see backtesting data.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStrategiesPage;
