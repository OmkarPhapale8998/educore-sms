const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Exam = require("../models/Exam");
const Marks = require("../models/Marks");
const Student = require("../models/Student");
const { generateMarksheet } = require("../utils/pdfGenerator");

router.use(protect);

// GET all exams
router.get("/", async (req, res, next) => {
  try {
    const { department, semester, type, status } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (type) query.type = type;
    if (status) query.status = status;
    const exams = await Exam.find(query).populate("course", "name code").sort({ date: -1 });
    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("course", "name code credits");
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({ success: true, message: "Exam scheduled", data: exam });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Exam deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
