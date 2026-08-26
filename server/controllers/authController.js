// ============================================================
// controllers/authController.js
// Handles everything about user accounts: register, login,
// logout, profile update, and the forgot/reset password flow.
// A "controller" holds the actual logic a route calls.
// Passwords are hashed with bcrypt; logins use JWT tokens.
// ============================================================
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { query } = require("../config/db");
const sendEmail = require("../utils/emailSender");

// Helper: generate JWT and send as cookie + response
// Used by register / login / reset-password to log the user in.
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  // Sign a token that stores the user id + role, valid for 7 days
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true, // JavaScript in the browser cannot read this cookie (safer)
    sameSite: "lax"
  };
  if (process.env.NODE_ENV === "production") options.secure = true; // HTTPS-only cookie in production

  // Send the token both as a cookie AND in the JSON body (frontend can pick either)
  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        phone: user.phone
      }
    });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  try {
    // Check validation rules defined in routes/auth.js
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    // Pull all possible fields from the request body (role defaults to student)
    const {
      name,
      email,
      password,
      role = "student",
      phone,
      department,
      semester,
      rollNo,
      admissionYear,
      employeeId,
      designation,
      qualification,
      experience,
      gender,
      guardianName,
      guardianPhone
    } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    // Reject registration if that email is already taken
    const existing = await query("SELECT id FROM users WHERE email = $1", [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const userRole = (role || "student").toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12); // never store plain passwords

    // Step 1: create the base login account for every role
    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id AS "_id", name, email, role, phone, photo`,
      [name.trim(), cleanEmail, hashedPassword, userRole, phone || ""]
    );
    const user = rows[0];

    // Step 2: create the extra profile row for students/faculty
    if (userRole === "student") {
      const selectedDept = department || "Computer Science";
      const selectedSem = semester ? parseInt(semester) : 1;
      const currentYear = admissionYear ? parseInt(admissionYear) : new Date().getFullYear();

      // Build a roll number automatically if none was provided:
      // dept initials + year + random 3 digits (e.g. CS2026482)
      let generatedRollNo = rollNo ? rollNo.trim().toUpperCase() : "";
      if (!generatedRollNo) {
        const deptCode = selectedDept.split(" ").map(w => w[0]).join("").toUpperCase();
        const randNum = Math.floor(100 + Math.random() * 900);
        generatedRollNo = `${deptCode}${currentYear}${randNum}`;
      }

      // If that roll number already exists, keep adding _1, _2... until unique
      let dup = await query("SELECT id FROM students WHERE roll_no = $1", [generatedRollNo]);
      let counter = 1;
      while (dup.rows.length > 0) {
        generatedRollNo = `${generatedRollNo}_${counter++}`;
        dup = await query("SELECT id FROM students WHERE roll_no = $1", [generatedRollNo]);
      }

      await query(
        `INSERT INTO students (user_id, roll_no, department, semester, admission_year, gender, guardian_name, guardian_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user._id, generatedRollNo, selectedDept, selectedSem, currentYear, gender || null, guardianName || "", guardianPhone || ""]
      );
    } else if (userRole === "faculty") {
      const selectedDept = department || "Computer Science";
      // Auto-generate an employee ID like FAC482 when not provided
      let generatedEmpId = employeeId ? employeeId.trim().toUpperCase() : "";
      if (!generatedEmpId) {
        const randNum = Math.floor(100 + Math.random() * 900);
        generatedEmpId = `FAC${randNum}`;
      }

      // Same trick: add _1, _2... until the employee ID is unique
      let dup = await query("SELECT id FROM faculties WHERE employee_id = $1", [generatedEmpId]);
      let counter = 1;
      while (dup.rows.length > 0) {
        generatedEmpId = `${generatedEmpId}_${counter++}`;
        dup = await query("SELECT id FROM faculties WHERE employee_id = $1", [generatedEmpId]);
      }

      await query(
        `INSERT INTO faculties (user_id, employee_id, department, designation, qualification, experience)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user._id, generatedEmpId, selectedDept, designation || "Assistant Professor", qualification ? [qualification] : ["B.Tech", "M.Tech"], experience ? parseInt(experience) : 1]
      );
    }

    // Registration done — log the new user straight in
    sendTokenResponse(user, 201, res, "Account created successfully");
  } catch (err) {
    next(err);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    // Look up the user by email (need the hashed password column too)
    const { rows } = await query(
      `SELECT id AS "_id", name, email, password, role, phone, photo, "is_active" AS "isActive"
       FROM users WHERE email = $1`,
      [cleanEmail]
    );
    const dbUser = rows[0];

    // Same generic error for "no such user" or "wrong password"
    // so attackers can't discover which emails exist
    if (!dbUser || !(await bcrypt.compare(cleanPassword, dbUser.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!dbUser.isActive) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }

    // Remember the time of this login
    await query("UPDATE users SET last_login = now() WHERE id = $1", [dbUser._id]);

    sendTokenResponse(dbUser, 200, res, "Login successful");
  } catch (err) {
    next(err);
  }
};

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Private
// JWTs can't be "deleted", so we overwrite the cookie with junk
// that expires in 10 seconds — effectively logging out.
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// @desc   Get current user
// @route  GET /api/auth/me
// @access Private
// Returns whoever is logged in (protect already put them on req.user)
exports.getMe = async (req, res, next) => {
  res.json({ success: true, user: req.user });
};

// @desc   Update user profile
// @route  PUT /api/auth/update-profile
// @access Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    // multer saved an uploaded photo on disk; normalize its path separators
    const photo = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // COALESCE($x, col) keeps the old value when nothing new was sent
    const { rows } = await query(
      `UPDATE users SET name = COALESCE($2, name), phone = COALESCE($3, phone), photo = COALESCE($4, photo)
       WHERE id = $1
       RETURNING id AS "_id", name, email, role, phone, photo, "is_active" AS "isActive"`,
      [req.user._id, name || null, phone !== undefined ? phone : null, photo]
    );

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// @desc   Change password
// @route  PUT /api/auth/change-password
// @access Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query("SELECT password FROM users WHERE id = $1", [req.user._id]);
    const dbUser = rows[0];

    // User must prove they know their existing password first
    if (!(await bcrypt.compare(currentPassword || "", dbUser.password))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password = $2 WHERE id = $1", [req.user._id, hashed]);

    sendTokenResponse({ ...dbUser, _id: req.user._id, ...req.user }, 200, res, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

// @desc   Forgot password - send reset email
// @route  POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const cleanEmail = (req.body.email || "").trim().toLowerCase();
    const { rows } = await query("SELECT id, email FROM users WHERE email = $1", [cleanEmail]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }

    // Create a random token; store only its SHA-256 hash in the DB
    // so a database leak can't be used to reset passwords
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await query(
      `UPDATE users SET reset_password_token = $2, reset_password_expire = $3 WHERE id = $1`,
      [user.id, hashedToken, new Date(Date.now() + 10 * 60 * 1000)] // valid for 10 minutes only
    );

    // The email contains the RAW token; only the hash is stored server-side
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const html = `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
        <h2 style="color:#00236f">EduCore SMS - Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#00236f;color:white;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a>
        <p style="color:#666">This link expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject: "EduCore - Password Reset Request", html });
      res.json({ success: true, message: "Password reset email sent" });
    } catch (emailErr) {
      // Email failed -> clear the token so it can't be used
      await query(`UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = $1`, [user.id]);
      return res.status(500).json({ success: false, message: "Email could not be sent" });
    }
  } catch (err) {
    next(err);
  }
};

// @desc   Reset password
// @route  POST /api/auth/reset-password/:token
// @access Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Hash the token from the URL the same way we stored it
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    // Token must match AND still be unexpired
    const { rows } = await query(
      `SELECT id AS "_id", name, email, role, phone, photo FROM users
       WHERE reset_password_token = $1 AND reset_password_expire > now()`,
      [hashedToken]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    // Save the new password and clear the one-time token fields
    const hashed = await bcrypt.hash(req.body.password, 12);
    await query(
      `UPDATE users SET password = $2, reset_password_token = NULL, reset_password_expire = NULL WHERE id = $1`,
      [user._id, hashed]
    );

    sendTokenResponse(user, 200, res, "Password reset successful");
  } catch (err) {
    next(err);
  }
};
