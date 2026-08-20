const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const sendEmail = require("../utils/emailSender");

// Helper: generate JWT and send as cookie + response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax"
  };
  if (process.env.NODE_ENV === "production") options.secure = true;

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const userRole = (role || "student").toLowerCase();

    // Create base user record
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone
    });

    // Create role-specific linked profile
    if (userRole === "student") {
      const selectedDept = department || "Computer Science";
      const selectedSem = semester ? parseInt(semester) : 1;
      const currentYear = admissionYear ? parseInt(admissionYear) : new Date().getFullYear();

      let generatedRollNo = rollNo ? rollNo.trim().toUpperCase() : "";
      if (!generatedRollNo) {
        const deptCode = selectedDept.split(" ").map(w => w[0]).join("").toUpperCase();
        const randNum = Math.floor(100 + Math.random() * 900);
        generatedRollNo = `${deptCode}${currentYear}${randNum}`;
      }

      // Ensure rollNo uniqueness
      let existingStudent = await Student.findOne({ rollNo: generatedRollNo });
      let counter = 1;
      while (existingStudent) {
        generatedRollNo = `${generatedRollNo}_${counter++}`;
        existingStudent = await Student.findOne({ rollNo: generatedRollNo });
      }

      await Student.create({
        userId: user._id,
        rollNo: generatedRollNo,
        department: selectedDept,
        semester: selectedSem,
        admissionYear: currentYear,
        gender: gender || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined
      });
    } else if (userRole === "faculty") {
      const selectedDept = department || "Computer Science";
      let generatedEmpId = employeeId ? employeeId.trim().toUpperCase() : "";
      if (!generatedEmpId) {
        const randNum = Math.floor(100 + Math.random() * 900);
        generatedEmpId = `FAC${randNum}`;
      }

      let existingFaculty = await Faculty.findOne({ employeeId: generatedEmpId });
      let counter = 1;
      while (existingFaculty) {
        generatedEmpId = `${generatedEmpId}_${counter++}`;
        existingFaculty = await Faculty.findOne({ employeeId: generatedEmpId });
      }

      await Faculty.create({
        userId: user._id,
        employeeId: generatedEmpId,
        department: selectedDept,
        designation: designation || "Assistant Professor",
        qualification: qualification ? [qualification] : ["B.Tech", "M.Tech"],
        experience: experience ? parseInt(experience) : 1
      });
    }

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

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (err) {
    next(err);
  }
};

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Private
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
exports.getMe = async (req, res, next) => {
  res.json({ success: true, user: req.user });
};

// @desc   Update user profile
// @route  PUT /api/auth/update-profile
// @access Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const fieldsToUpdate = { name, phone };
    if (req.file) fieldsToUpdate.photo = req.file.path.replace(/\\/g, "/");

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, user });
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
    const user = await User.findById(req.user.id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

// @desc   Forgot password - send reset email
// @route  POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

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
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
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
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successful");
  } catch (err) {
    next(err);
  }
};
