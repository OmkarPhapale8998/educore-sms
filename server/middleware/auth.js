// ============================================================
// middleware/auth.js
// Authentication + authorization middleware.
// "protect" checks the JWT token and attaches the logged-in
// user to req.user. "authorize" limits a route to given roles.
// A "middleware" is a function that runs before the controller.
// ============================================================
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first, then cookie
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1]; // format: "Bearer <token>"
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // No token anywhere = not logged in
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token." });
    }

    // Decode the token to find out which user it belongs to,
    // then load that user fresh from the database.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      `SELECT id AS "_id", name, email, role, phone, photo, "is_active" AS "isActive", created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Deactivated accounts cannot use the API even with a valid token
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }

    // Attach the user so controllers can use req.user
    req.user = user;
    next(); // move on to the actual route handler
  } catch (err) {
    // jwt.verify throws for expired or tampered tokens
    return res.status(401).json({ success: false, message: "Not authorized. Invalid token." });
  }
};

// Role-based access control
// Usage: authorize("admin") — only admins may pass; others get 403.
// Must run AFTER protect so req.user already exists.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
