import React, { useEffect, useState } from 'react';

export default function BrokerFailoverPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/broker-failover')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ error: 'Unable to load broker failover readiness.' }));
  }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="page-container">
      <h1>Broker Failover Readiness</h1>
      <p>Operational readiness for routing orders across primary, secondary, and manual execution venues.</p>
      <div className="stats-grid">
        <div className="stat-card"><span>Readiness</span><strong>{data.summary?.readinessScore}</strong></div>
        <div className="stat-card"><span>Primary Latency</span><strong>{data.summary?.primaryLatencyMs} ms</strong></div>
        <div className="stat-card"><span>Secondary Latency</span><strong>{data.summary?.secondaryLatencyMs} ms</strong></div>
        <div className="stat-card"><span>Blocked Strategies</span><strong>{data.summary?.blockedStrategies}</strong></div>
      </div>
      <div className="card">
        {data.brokers?.map((broker) => (
          <div key={broker.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr', gap: 12, padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <strong>{broker.name}</strong><span>{broker.role}</span><span>{broker.status}</span><span>{broker.latencyMs} ms</span><span>{broker.issue}</span>
          </div>
        ))}
      </div>
      <div className="card"><h2>Controls</h2><ul>{data.controls?.map((control) => <li key={control}>{control}</li>)}</ul></div>
    </div>
  );
}
