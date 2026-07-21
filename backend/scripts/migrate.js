const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Sequelize = require('sequelize');
const { sequelize } = require('../src/config/database');

const directory = path.resolve(__dirname, '../migrations');
const files = fs.readdirSync(directory).filter(name => name.endsWith('.js')).sort();

async function ensureMetadata() {
  await sequelize.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY NOT NULL)');
}

async function appliedMigrations() {
  const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
  return rows.map(row => row.name);
}

async function up() {
  const applied = new Set(await appliedMigrations());
  for (const file of files.filter(name => !applied.has(name))) {
    await require(path.join(directory, file)).up(sequelize.getQueryInterface(), Sequelize);
    await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name)', { replacements: { name: file } });
    console.log(`Migrated ${file}`);
  }
}

async function down() {
  const applied = await appliedMigrations();
  const file = applied.at(-1);
  if (!file) return console.log('No migration to undo');
  if (!files.includes(file)) throw new Error(`Applied migration ${file} is not present on disk`);
  await require(path.join(directory, file)).down(sequelize.getQueryInterface(), Sequelize);
  await sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = :name', { replacements: { name: file } });
  console.log(`Reverted ${file}`);
}

async function main() {
  const command = process.argv[2] || 'up';
  if (!['up', 'down'].includes(command)) throw new Error('Usage: node scripts/migrate.js up|down');
  await sequelize.authenticate();
  await sequelize.query("SELECT pg_advisory_lock(hashtext('trading-schema-migrations'))");
  try {
    await ensureMetadata();
    await (command === 'up' ? up() : down());
  } finally {
    await sequelize.query("SELECT pg_advisory_unlock(hashtext('trading-schema-migrations'))");
  }
}

main().catch(error => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
}).finally(() => sequelize.close());
