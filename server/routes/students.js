// ============================================================
// routes/students.js
// All REST endpoints for the Students module.
// A "route" maps an incoming URL + HTTP method to a function.
// Every endpoint here requires login (protect); some are
// further restricted to admin only (authorize).
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getStudents, getStudent, createStudent,
  updateStudent, deleteStudent, uploadDocument, getAttendanceSummary
} = require("../controllers/studentController");

// Apply the JWT check to ALL student routes below this line
router.use(protect);

// @route  GET  /api/students   List students (filters + pagination)
// @route  POST /api/students  Add a new student (admin only)
router.route("/")
  .get(authorize("admin", "faculty", "student"), getStudents)
  .post(authorize("admin"), createStudent);

// @route  GET    /api/students/:id  One student's full profile
// @route  PUT    /api/students/:id  Update a student (admin only)
// @route  DELETE /api/students/:id  Remove a student (admin only)
router.route("/:id")
  .get(getStudent)
  .put(authorize("admin"), updateStudent)
  .delete(authorize("admin"), deleteStudent);

// @route  POST /api/students/:id/documents
// Uploads a document file for one student (admin only).
router.post("/:id/documents", authorize("admin"), upload.single("document"), uploadDocument);

// @route  GET /api/students/:id/attendance-summary
// Per-course attendance totals + percentage for one student.
router.get("/:id/attendance-summary", getAttendanceSummary);

module.exports = router;
