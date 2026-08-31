const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const sendEmail = require("../utils/emailSender");

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

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const {
      name, email, password, role = "student", phone, department, semester,
      rollNo, admissionYear, employeeId, designation, qualification, experience,
      gender, guardianName, guardianPhone
    } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const userRole = (role || "student").toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: userRole,
      phone: phone || ""
    });

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

      let dup = await Student.findOne({ roll_no: generatedRollNo });
      let counter = 1;
      while (dup) {
        generatedRollNo = `${generatedRollNo}_${counter++}`;
        dup = await Student.findOne({ roll_no: generatedRollNo });
      }

      await Student.create({
        user_id: user._id,
        roll_no: generatedRollNo,
        department: selectedDept,
        semester: selectedSem,
        admission_year: currentYear,
        gender: gender || null,
        guardian_name: guardianName || "",
        guardian_phone: guardianPhone || ""
      });
    } else if (userRole === "faculty") {
      const selectedDept = department || "Computer Science";
      let generatedEmpId = employeeId ? employeeId.trim().toUpperCase() : "";
      if (!generatedEmpId) {
        const randNum = Math.floor(100 + Math.random() * 900);
        generatedEmpId = `FAC${randNum}`;
      }

      let dup = await Faculty.findOne({ employee_id: generatedEmpId });
      let counter = 1;
      while (dup) {
        generatedEmpId = `${generatedEmpId}_${counter++}`;
        dup = await Faculty.findOne({ employee_id: generatedEmpId });
      }

      await Faculty.create({
        user_id: user._id,
        employee_id: generatedEmpId,
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

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user || !(await bcrypt.compare(cleanPassword, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: "Account is deactivated" });
    }

    user.last_login = new Date();
    await user.save();

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.json({ success: true, message: "Logged out successfully" });
};

exports.getMe = async (req, res, next) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const photo = req.file ? req.file.path.replace(/\\/g, "/") : null;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (photo) updateData.photo = photo;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await bcrypt.compare(currentPassword || "", user.password))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    sendTokenResponse(user, 200, res, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const cleanEmail = (req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.reset_password_token = hashedToken;
    user.reset_password_expire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

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
      user.reset_password_token = undefined;
      user.reset_password_expire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Email could not be sent" });
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(req.body.password, 12);
    user.reset_password_token = undefined;
    user.reset_password_expire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successful");
  } catch (err) {
    next(err);
  }
};
