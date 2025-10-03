require('dotenv').config(); // učitaj .env
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Log some info (redact sensitive parts)
console.log('DB config:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Handle unexpected errors from idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err && err.stack ? err.stack : err);
});

// Try an initial connection so we fail fast on startup (and log the real error)
pool.connect()
  .then(client => {
    client.release();
    console.log('Initial DB connection successful');
  })
  .catch(err => {
    console.error('Initial DB connection error:', err && err.stack ? err.stack : err);
  });

// TEST ROUTE
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ serverTime: result.rows[0].now });
  } catch (err) {
    // Log full error and return helpful details for debugging (remove details in production)
    console.error('DB ERROR:', err && err.stack ? err.stack : err);
    const payload = { error: 'Database error' };
    if (err && err.message) payload.details = err.message;
    if (err && err.code) payload.code = err.code;
    // In development include stack
    if (process.env.NODE_ENV !== 'production' && err && err.stack) payload.stack = err.stack;
    res.status(500).json(payload);
  }
});

const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));