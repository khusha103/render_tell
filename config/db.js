// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
//   host: process.env.DB_HOST,
//   dialect: 'postgres',
// });

// module.exports = { sequelize };

// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  idleTimeoutMillis: 30000,         // 30 seconds - closes idle clients
  connectionTimeoutMillis: 5000,    // 5 seconds - give up connecting after this
  keepAlive: true                   // keeps TCP connection alive
});

// Optional: Handle pool-level errors to avoid crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // process.exit(-1); // Uncomment if you want to crash on pool errors
});

module.exports = pool;






