const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getStudents, getStudent, createStudent,
  updateStudent, deleteStudent, uploadDocument, getAttendanceSummary
} = require("../controllers/studentController");

router.use(protect);

router.route("/")
  .get(authorize("admin", "faculty"), getStudents)
  .post(authorize("admin"), createStudent);

router.route("/:id")
  .get(getStudent)
  .put(authorize("admin"), updateStudent)
  .delete(authorize("admin"), deleteStudent);

router.post("/:id/documents", authorize("admin"), upload.single("document"), uploadDocument);
router.get("/:id/attendance-summary", getAttendanceSummary);

module.exports = router;
