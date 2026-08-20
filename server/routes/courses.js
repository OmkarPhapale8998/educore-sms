const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Course = require("../models/Course");

router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }];
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate({ path: "assignedFaculty", populate: { path: "userId", select: "name" } })
      .sort({ code: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, data: courses, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({ path: "assignedFaculty", populate: { path: "userId", select: "name email" } });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, message: "Course created", data: course });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.patch("/:id/syllabus-unit/:unitId", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    const unit = course.syllabusUnits.id(req.params.unitId);
    if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });
    unit.set(req.body);
    await course.save();
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.post("/:id/syllabus", authorize("admin", "faculty"), upload.single("syllabus"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const course = await Course.findByIdAndUpdate(req.params.id, { syllabusFile: req.file.path.replace(/\\/g, "/") }, { new: true });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
