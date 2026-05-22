const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Broker Failover Readiness',
    summary: { readinessScore: 82, primaryLatencyMs: 114, secondaryLatencyMs: 146, blockedStrategies: 2 },
    brokers: [
      { name: 'Alpaca', role: 'Primary', status: 'Ready', latencyMs: 114, issue: 'None' },
      { name: 'Paper Broker', role: 'Secondary', status: 'Ready', latencyMs: 146, issue: 'Reduced options support' },
      { name: 'Manual Desk', role: 'Tertiary', status: 'Review', latencyMs: 900, issue: 'Requires human approval' },
    ],
    controls: [
      'Verify open orders can be cancelled before routing failover entries.',
      'Pause strategies with unsupported order types on secondary broker.',
      'Run heartbeat checks before market open and after API error spikes.',
    ],
  });
});

module.exports = router;
