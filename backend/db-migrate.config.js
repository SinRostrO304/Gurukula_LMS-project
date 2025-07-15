// backend/db-migrate.config.js
require('dotenv').config({ path: '../.env' })

module.exports = {
  // Pick up your DATABASE_URL from .env
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: 'pgmigrations',
  dir: __dirname,
}
