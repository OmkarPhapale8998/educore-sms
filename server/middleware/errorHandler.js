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

  // PostgreSQL error codes -> readable messages for the client

  if (err.code === "23505") { // unique constraint violated (e.g. duplicate email)
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  if (err.code === "23503") { // foreign key violated (related row missing)
    statusCode = 400;
    message = "Referenced record does not exist";
  }

  if (err.code === "23514" || err.code === "22P02") { // bad value / bad uuid format
    statusCode = 400;
    message = "Invalid data format";
  }

  if (err.code === "28P01" || err.code === "42501") { // DB login or permission failure
    statusCode = 500;
    message = "Database authentication/permission error";
  }

  if (err.name === "JsonWebTokenError") { // malformed JWT
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") { // JWT past its expiry
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
