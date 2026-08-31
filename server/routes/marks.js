const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Mark = require("../models/Mark");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const { generateMarksheet } = require("../utils/pdfGenerator");

router.use(protect);

const GRADE_THRESHOLDS = [
  { min: 90, grade: "O", points: 10 },
  { min: 80, grade: "A+", points: 9 },
  { min: 70, grade: "A", points: 8 },
  { min: 60, grade: "B+", points: 7 },
  { min: 50, grade: "B", points: 6 },
  { min: 40, grade: "C", points: 5 },
  { min: 0, grade: "F", points: 0 }
];

const calculateGrade = (obtained, total) => {
  const pct = total > 0 ? (obtained / total) * 100 : 0;
  const gradeObj = GRADE_THRESHOLDS.find(g => pct >= g.min);
  return { percentage: parseFloat(pct.toFixed(2)), grade: gradeObj.grade, gradePoints: gradeObj.points };
};

router.get("/exam/:examId", async (req, res, next) => {
  try {
    const marks = await Mark.find({ exam_id: req.params.examId })
      .populate('student_id course_id')
      .sort({ created_at: 1 });
      
    const data = marks.map(m => {
      const obj = m.toObject();
      return {
        _id: obj._id,
        student: { _id: obj.student_id ? obj.student_id._id : null },
        course: { _id: obj.course_id ? obj.course_id._id : null },
        theoryMarks: obj.theory_marks,
        internalMarks: obj.internal_marks,
        practicalMarks: obj.practical_marks,
        totalObtained: obj.total_obtained,
        totalMaximum: obj.total_maximum,
        percentage: obj.percentage,
        grade: obj.grade,
        gradePoints: obj.grade_points,
        isAbsent: obj.is_absent
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/student/:studentId", async (req, res, next) => {
  try {
    const marks = await Mark.find({ student_id: req.params.studentId })
      .populate('exam_id')
      .populate('course_id');

    // Sort by exam date
    marks.sort((a, b) => {
      if (!a.exam_id || !b.exam_id) return 0;
      return new Date(a.exam_id.date) - new Date(b.exam_id.date);
    });

    const data = marks.map(m => {
      const obj = m.toObject();
      return {
        _id: obj._id,
        exam: obj.exam_id ? {
          _id: obj.exam_id._id,
          name: obj.exam_id.name,
          type: obj.exam_id.type,
          date: obj.exam_id.date,
          totalMarks: obj.exam_id.total_marks,
          passingMarks: obj.exam_id.passing_marks
        } : null,
        course: obj.course_id ? { 
          _id: obj.course_id._id, 
          name: obj.course_id.name, 
          code: obj.course_id.code, 
          credits: obj.course_id.credits 
        } : null,
        theoryMarks: obj.theory_marks,
        internalMarks: obj.internal_marks,
        practicalMarks: obj.practical_marks,
        totalObtained: obj.total_obtained,
        totalMaximum: obj.total_maximum,
        percentage: obj.percentage,
        grade: obj.grade,
        gradePoints: obj.grade_points,
        isAbsent: obj.is_absent
      };
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/bulk", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { examId, marksData } = req.body;
    
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    for (const m of marksData) {
      const isAbsent = !!m.isAbsent;
      const theory = isAbsent ? 0 : Number(m.theoryMarks) || 0;
      const internal = isAbsent ? 0 : Number(m.internalMarks) || 0;
      const practical = isAbsent ? 0 : Number(m.practicalMarks) || 0;
      const totalObtained = theory + internal + practical;
      const { percentage, grade, gradePoints } = calculateGrade(totalObtained, exam.total_marks);
      
      await Mark.findOneAndUpdate(
        { student_id: m.studentId, exam_id: examId },
        {
          $set: {
            course_id: exam.course_id,
            theory_marks: theory,
            internal_marks: internal,
            practical_marks: practical,
            total_obtained: totalObtained,
            total_maximum: exam.total_marks,
            percentage,
            grade,
            grade_points: gradePoints,
            is_absent: isAbsent,
            entered_by: req.user._id
          }
        },
        { upsert: true }
      );
    }

    const studentIds = [...new Set(marksData.map(m => String(m.studentId)))];
    if (studentIds.length > 0) {
      const students = await Student.find({ _id: { $in: studentIds } });
      
      const notifications = students.map(s => ({
        recipient: s.user_id,
        type: 'marks_published',
        title: "Marks Published",
        message: `Marks for ${exam.name} have been published. Check your results.`,
        related_id: examId,
        related_model: 'Exam'
      }));
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    exam.status = 'completed';
    await exam.save();
    
    res.json({ success: true, message: `Marks entered for ${marksData.length} students` });
  } catch (err) { next(err); }
});

router.get("/report/:studentId/:examId", async (req, res, next) => {
  try {
    const mark = await Mark.findOne({ student_id: req.params.studentId, exam_id: req.params.examId })
      .populate({
        path: 'student_id',
        populate: { path: 'user_id' }
      })
      .populate('exam_id')
      .populate('course_id');

    if (!mark) return res.status(404).json({ success: false, message: "Marks not found" });

    const obj = mark.toObject();
    
    const formattedMarks = {
      _id: obj._id,
      student: {
        _id: obj.student_id._id,
        rollNo: obj.student_id.roll_no,
        department: obj.student_id.department,
        semester: obj.student_id.semester,
        userId: { 
          _id: obj.student_id.user_id._id, 
          name: obj.student_id.user_id.name, 
          email: obj.student_id.user_id.email 
        }
      },
      exam: {
        _id: obj.exam_id._id,
        name: obj.exam_id.name,
        type: obj.exam_id.type,
        date: obj.exam_id.date,
        totalMarks: obj.exam_id.total_marks,
        passingMarks: obj.exam_id.passing_marks
      },
      course: { 
        _id: obj.course_id._id, 
        name: obj.course_id.name, 
        code: obj.course_id.code, 
        credits: obj.course_id.credits 
      },
      theoryMarks: obj.theory_marks,
      internalMarks: obj.internal_marks,
      practicalMarks: obj.practical_marks,
      totalObtained: obj.total_obtained,
      totalMaximum: obj.total_maximum,
      percentage: obj.percentage,
      grade: obj.grade,
      gradePoints: obj.grade_points,
      isAbsent: obj.is_absent
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=marksheet-${req.params.studentId}.pdf`);
    generateMarksheet(formattedMarks, res);
  } catch (err) { next(err); }
});

module.exports = router;
