const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Marks = require("../models/Marks");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const { generateMarksheet } = require("../utils/pdfGenerator");

router.use(protect);

// GET marks for an exam
router.get("/exam/:examId", async (req, res, next) => {
  try {
    const marks = await Marks.find({ exam: req.params.examId })
      .populate({ path: "student", populate: { path: "userId", select: "name" } })
      .populate("course", "name code");
    res.json({ success: true, data: marks });
  } catch (err) { next(err); }
});

// GET marks for a student
router.get("/student/:studentId", async (req, res, next) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId })
      .populate("exam", "name type date totalMarks passingMarks")
      .populate("course", "name code credits");
    res.json({ success: true, data: marks });
  } catch (err) { next(err); }
});

// POST bulk enter marks
router.post("/bulk", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { examId, marksData } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const ops = marksData.map(m => ({
      updateOne: {
        filter: { student: m.studentId, exam: examId },
        update: {
          $set: {
            course: exam.course,
            theoryMarks: m.theoryMarks || 0,
            internalMarks: m.internalMarks || 0,
            practicalMarks: m.practicalMarks || 0,
            totalMaximum: exam.totalMarks,
            isAbsent: m.isAbsent || false,
            enteredBy: req.user._id
          }
        },
        upsert: true
      }
    }));
    await Marks.bulkWrite(ops);

    // Notify students
    for (const m of marksData) {
      const student = await Student.findById(m.studentId);
      if (student) {
        await Notification.create({
          recipient: student.userId,
          type: "marks_published",
          title: "Marks Published",
          message: `Marks for ${exam.name} have been published. Check your results.`,
          relatedId: examId,
          relatedModel: "Exam"
        });
      }
    }

    await Exam.findByIdAndUpdate(examId, { status: "completed" });
    res.json({ success: true, message: `Marks entered for ${marksData.length} students` });
  } catch (err) { next(err); }
});

// GET marksheet PDF
router.get("/report/:studentId/:examId", async (req, res, next) => {
  try {
    const marks = await Marks.findOne({ student: req.params.studentId, exam: req.params.examId })
      .populate({ path: "student", populate: { path: "userId", select: "name email" } })
      .populate("exam", "name type date totalMarks passingMarks")
      .populate("course", "name code credits");

    if (!marks) return res.status(404).json({ success: false, message: "Marks not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=marksheet-${req.params.studentId}.pdf`);
    generateMarksheet(marks, res);
  } catch (err) { next(err); }
});

module.exports = router;
