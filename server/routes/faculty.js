const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Faculty = require("../models/Faculty");
const User = require("../models/User");

router.use(protect);

// GET all faculty
router.get("/", authorize("admin", "faculty", "student"), async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;

    let userFilter = {};
    if (search) userFilter = { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] };

    const matchingUsers = search ? (await User.find(userFilter).select("_id")).map(u => u._id) : null;
    if (matchingUsers) query.userId = { $in: matchingUsers };

    const total = await Faculty.countDocuments(query);
    const faculty = await Faculty.find(query)
      .populate("userId", "name email phone photo")
      .populate("subjectsAssigned", "name code")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, data: faculty, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET single faculty
router.get("/:id", async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate("userId", "name email phone photo")
      .populate("subjectsAssigned", "name code department semester");
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });
    res.json({ success: true, data: faculty });
  } catch (err) { next(err); }
});

// POST create faculty
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, password, employeeId, department, designation, qualification, joiningDate } = req.body;
    const user = await User.create({ name, email, phone, password: password || "Faculty@123", role: "faculty" });
    const faculty = await Faculty.create({ userId: user._id, employeeId, department, designation, qualification, joiningDate });
    const populated = await Faculty.findById(faculty._id).populate("userId", "name email phone photo");
    res.status(201).json({ success: true, message: "Faculty created", data: populated });
  } catch (err) { next(err); }
});

// PUT update faculty
router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, department, designation, qualification, status, subjectsAssigned } = req.body;
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });
    if (name || email || phone) await User.findByIdAndUpdate(faculty.userId, { name, email, phone });
    const updated = await Faculty.findByIdAndUpdate(
      req.params.id,
      { department, designation, qualification, status, subjectsAssigned },
      { new: true }
    ).populate("userId", "name email phone photo");
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE faculty
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });
    await User.findByIdAndDelete(faculty.userId);
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Faculty deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
