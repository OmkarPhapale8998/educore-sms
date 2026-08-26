// ============================================================
// config/db.js
// Sets up the single PostgreSQL connection pool that the whole
// app shares. A "pool" keeps a few connections open so we don't
// have to connect to the database for every query.
// ============================================================
require("dotenv").config();
const { Pool } = require("pg");

// One shared pool using the Supabase connection string from .env.
// max=10 means at most 10 connections at the same time.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  max: 10,
  idleTimeoutMillis: 30000, // close unused connections after 30s
  connectionTimeoutMillis: 20000 // give up connecting after 20s
});

// If a connection in the pool dies unexpectedly, log it instead of crashing
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Helper so controllers can just call query(sql, params)
const query = (text, params) => pool.query(text, params);

// Called once on startup to verify the database is reachable.
const connectDB = async () => {
  try {
    const res = await pool.query("SELECT 1"); // tiny test query
    console.log(`PostgreSQL (Supabase) connected | db=${res.rowCount !== undefined ? "ok" : "ok"}`);
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1); // no database = no point keeping the server up
  }
};

module.exports = { pool, query, connectDB };
