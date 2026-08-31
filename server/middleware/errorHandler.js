// ============================================================
// middleware/errorHandler.js
// One central place that catches every error thrown by routes
// and turns database/JWT error codes into friendly messages.
// Registered last in server.js (app.use(errorHandler)).
// ============================================================
const errorHandler = (err, req, res, next) => {
  // Start with the error's own status/message, else default to 500 Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // MongoDB / Mongoose error codes -> readable messages for the client

  if (err.code === 11000) {
    // Duplicate key error (e.g. duplicate email or roll_no)
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value: '${err.keyValue?.[field]}' is already in use for '${field}'`;
  }

  if (err.name === "ValidationError") {
    // Mongoose schema validation failed
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(". ");
  }

  if (err.name === "CastError") {
    // Invalid ObjectId or wrong type cast (e.g. /students/not-an-id)
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  if (err.name === "JsonWebTokenError") {
    // Malformed JWT
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    // JWT past its expiry
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // stack only in dev mode
  });
};

module.exports = errorHandler;
