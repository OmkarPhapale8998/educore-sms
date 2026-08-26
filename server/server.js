// ============================================================
// server.js
// The main entry point of the EduCore backend.
// It creates the Express app, sets up middleware (CORS, JSON
// parsing, cookies), connects all API routes under /api/...,
// starts an error handler and listens on a port.
// ============================================================
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load variables from the .env file into process.env
dotenv.config();

// Connect to PostgreSQL (Supabase) before handling requests
connectDB();

const app = express();

// Middleware
// Only these frontend addresses are allowed to call our API (CORS whitelist)
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://10.184.165.32:5173",
  "http://10.184.165.32:5174",
  "http://10.184.165.32:5175"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server / curl) or from our known origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  credentials: true, // let the browser send cookies along with requests
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Parse incoming JSON bodies up to 10MB, form data, and cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
// Each module gets its own base URL; e.g. /api/students goes to routes/students.js
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/exams", require("./routes/exams"));
app.use("/api/marks", require("./routes/marks"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports", require("./routes/reports"));

// @route  GET /api/health
// Simple endpoint used to quickly check if the server is alive.
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "EduCore API is running" });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start the server on the port from .env (default 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EduCore server running on http://localhost:${PORT}`);
});
