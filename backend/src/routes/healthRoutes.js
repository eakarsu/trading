const express = require('express');
const { sequelize } = require('../config/database');
const router = express.Router();

// Simple health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'postgresql',
      apiServer: 'running'
    }
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: false,
        apiServer: true,
        dataServer: false
      },
      details: {}
    };

    // Check PostgreSQL connection via Sequelize
    try {
      await sequelize.authenticate();
      healthCheck.services.database = true;
      healthCheck.details.database = {
        status: 'connected',
        dialect: sequelize.getDialect(),
        name: sequelize.getDatabaseName ? sequelize.getDatabaseName() : 'postgresql'
      };
    } catch (error) {
      healthCheck.services.database = false;
      healthCheck.details.database = {
        status: 'disconnected',
        error: error.message
      };
    }

    // Placeholder for data server check
    healthCheck.services.dataServer = 'unknown';
    healthCheck.details.dataServer = {
      status: 'unknown',
      message: 'Data server health check not implemented yet'
    };

    const statusCode = healthCheck.services.database ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(500).json({
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
