// ============================================================
// routes/auth.js
// REST endpoints for authentication (register, login, logout,
// profile, password reset).
// A "route" maps an incoming URL + HTTP method to a function.
// Routes with "protect" require a valid JWT token.
// ============================================================
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  register, login, logout, getMe,
  updateProfile, changePassword,
  forgotPassword, resetPassword
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Validation rules
// These run before the controller and reject bad input early
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "faculty", "student"]).withMessage("Invalid role")
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];

// @route  POST /api/auth/register        Create a new account
// @route  POST /api/auth/login           Log in and get a JWT
// @route  POST /api/auth/logout          Clear the auth cookie
// @route  GET  /api/auth/me              Get the logged-in user's profile
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

// Profile updates need login; photo uploads go through multer first
router.put("/update-profile", protect, upload.single("photo"), updateProfile);
router.put("/change-password", protect, changePassword);

// Password recovery: request an email link, then set a new password using that token
router.post("/forgot-password", [body("email").isEmail()], forgotPassword);
router.post("/reset-password/:token", [body("password").isLength({ min: 6 })], resetPassword);

module.exports = router;
