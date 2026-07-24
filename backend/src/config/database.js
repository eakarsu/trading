const { Sequelize } = require('sequelize');

const options = {
  dialect: 'postgres',
  logging: process.env.DEBUG_SQL === 'true' ? console.log : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
};
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, options)
  : process.env.DB_HOST
    ? new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { ...options, host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432) })
    : new Sequelize('postgresql://localhost/ai_trading_platform', options);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error);
  }
};

module.exports = { sequelize, testConnection };
