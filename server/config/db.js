// ============================================================
// config/db.js
// Sets up MongoDB connection using Mongoose.
// Forces IPv4 (family: 4) to avoid NAT64/IPv6 routing issues
// that occur on some networks where SRV hostnames resolve to
// both IPv4 and IPv6 addresses.
// ============================================================
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Force IPv4 — prevents NAT64 IPv6 routing issues on some networks
      family: 4,
      // Generous timeouts for Atlas free-tier cold starts
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
