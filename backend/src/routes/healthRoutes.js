const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Simple health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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
    
    // Check database connection
    try {
      await mongoose.connection.db.admin().ping();
      healthCheck.services.database = true;
      healthCheck.details.database = {
        status: 'connected',
        name: mongoose.connection.name
      };
    } catch (error) {
      healthCheck.services.database = false;
      healthCheck.details.database = {
        status: 'disconnected',
        error: error.message
      };
    }
    
    // Check Python data server (if URL is available)
    try {
      // We'll implement this check when we have the data server health endpoint
      healthCheck.services.dataServer = 'unknown';
      healthCheck.details.dataServer = {
        status: 'unknown',
        message: 'Data server health check not implemented yet'
      };
    } catch (error) {
      healthCheck.services.dataServer = false;
      healthCheck.details.dataServer = {
        status: 'disconnected',
        error: error.message
      };
    }
    
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
