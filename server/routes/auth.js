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

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, upload.single("photo"), updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", [body("email").isEmail()], forgotPassword);
router.post("/reset-password/:token", [body("password").isLength({ min: 6 })], resetPassword);

module.exports = router;
