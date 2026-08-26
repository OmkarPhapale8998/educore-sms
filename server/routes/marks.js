// ============================================================
// routes/marks.js
// All REST endpoints for the Marks module: view marks per exam
// or student, bulk-enter marks, and download a PDF marksheet.
// Includes the grade calculation (O / A+ / A ... F) used
// everywhere in the app.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { query } = require("../config/db");
const { generateMarksheet } = require("../utils/pdfGenerator");

router.use(protect);

// Grade table: percentage >= min gets that letter grade + points
// (checked top-down, so 85% matches A+ before B+)
const GRADE_THRESHOLDS = [
  { min: 90, grade: "O", points: 10 },
  { min: 80, grade: "A+", points: 9 },
  { min: 70, grade: "A", points: 8 },
  { min: 60, grade: "B+", points: 7 },
  { min: 50, grade: "B", points: 6 },
  { min: 40, grade: "C", points: 5 },
  { min: 0, grade: "F", points: 0 }
];

// Convert obtained/total marks into a percentage + letter grade + points
const calculateGrade = (obtained, total) => {
  const pct = total > 0 ? (obtained / total) * 100 : 0;
  const gradeObj = GRADE_THRESHOLDS.find(g => pct >= g.min);
  return { percentage: parseFloat(pct.toFixed(2)), grade: gradeObj.grade, gradePoints: gradeObj.points };
};

// @route  GET /api/marks/exam/:examId
// All students' marks for one exam (used for the marks entry grid).
router.get("/exam/:examId", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT m.id AS "_id", m.student_id AS "studentId", m.course_id AS "courseId",
              m.theory_marks::float8 AS "theoryMarks",
              m.internal_marks::float8 AS "internalMarks",
              m.practical_marks::float8 AS "practicalMarks",
              m.total_obtained::float8 AS "totalObtained",
              m.total_maximum::float8 AS "totalMaximum",
              m.percentage::float8 AS "percentage",
              m.grade, m.grade_points::float8 AS "gradePoints",
              m.is_absent AS "isAbsent"
       FROM marks m
       WHERE m.exam_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.examId]
    );
    // Reshape flat rows into nested objects for the frontend
    const data = rows.map(r => ({
      _id: r._id,
      student: { _id: r.studentId },
      course: { _id: r.courseId },
      theoryMarks: r.theoryMarks,
      internalMarks: r.internalMarks,
      practicalMarks: r.practicalMarks,
      totalObtained: r.totalObtained,
      totalMaximum: r.totalMaximum,
      percentage: r.percentage,
      grade: r.grade,
      gradePoints: r.gradePoints,
      isAbsent: r.isAbsent
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// @route  GET /api/marks/student/:studentId
// Every mark record of one student across all exams and courses —
// this powers their personal results page.
router.get("/student/:studentId", async (req, res, next) => {
  try {
    // JOINs pull exam + course details so each row explains itself
    const { rows } = await query(
      `SELECT m.id AS "_id",
              m.theory_marks::float8 AS "theoryMarks",
              m.internal_marks::float8 AS "internalMarks",
              m.practical_marks::float8 AS "practicalMarks",
              m.total_obtained::float8 AS "totalObtained",
              m.total_maximum::float8 AS "totalMaximum",
              m.percentage::float8 AS "percentage",
              m.grade, m.grade_points::float8 AS "gradePoints",
              m.is_absent AS "isAbsent",
              e.id AS "examId", e.name AS "examName", e.type AS "examType", e.date AS "examDate",
              e.total_marks::float8 AS "examTotalMarks", e.passing_marks::float8 AS "examPassingMarks",
              c.id AS "courseId", c.name AS "courseName", c.code AS "courseCode", c.credits
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN courses c ON c.id = m.course_id
       WHERE m.student_id = $1
       ORDER BY e.date ASC`,
      [req.params.studentId]
    );
    const data = rows.map(r => ({
      _id: r._id,
      exam: {
        _id: r.examId,
        name: r.examName,
        type: r.examType,
        date: r.examDate,
        totalMarks: r.examTotalMarks,
        passingMarks: r.examPassingMarks
      },
      course: { _id: r.courseId, name: r.courseName, code: r.courseCode, credits: r.credits },
      theoryMarks: r.theoryMarks,
      internalMarks: r.internalMarks,
      practicalMarks: r.practicalMarks,
      totalObtained: r.totalObtained,
      totalMaximum: r.totalMaximum,
      percentage: r.percentage,
      grade: r.grade,
      gradePoints: r.gradePoints,
      isAbsent: r.isAbsent
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// @route  POST /api/marks/bulk   Enter marks for many students at once (admin/faculty)
router.post("/bulk", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { examId, marksData } = req.body;
    // The exam's total_marks decides every percentage below
    const examRes = await query("SELECT id, course_id, name, total_marks FROM exams WHERE id = $1", [examId]);
    if (examRes.rows.length === 0) return res.status(404).json({ success: false, message: "Exam not found" });
    const exam = examRes.rows[0];

    // UPSERT: if this student already has marks for this exam,
    // update them; otherwise insert a new row.
    for (const m of marksData) {
      // Absent students get zeros everywhere
      const isAbsent = !!m.isAbsent;
      const theory = isAbsent ? 0 : Number(m.theoryMarks) || 0;
      const internal = isAbsent ? 0 : Number(m.internalMarks) || 0;
      const practical = isAbsent ? 0 : Number(m.practicalMarks) || 0;
      const totalObtained = theory + internal + practical;
      const { percentage, grade, gradePoints } = calculateGrade(totalObtained, exam.total_marks);
      await query(
        `INSERT INTO marks (student_id, exam_id, course_id, theory_marks, internal_marks, practical_marks,
                            total_obtained, total_maximum, percentage, grade, grade_points, is_absent, entered_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (student_id, exam_id) DO UPDATE SET
           course_id = EXCLUDED.course_id,
           theory_marks = EXCLUDED.theory_marks,
           internal_marks = EXCLUDED.internal_marks,
           practical_marks = EXCLUDED.practical_marks,
           total_obtained = EXCLUDED.total_obtained,
           total_maximum = EXCLUDED.total_maximum,
           percentage = EXCLUDED.percentage,
           grade = EXCLUDED.grade,
           grade_points = EXCLUDED.grade_points,
           is_absent = EXCLUDED.is_absent,
           entered_by = EXCLUDED.entered_by`,
        [m.studentId, examId, exam.course_id, theory, internal, practical, totalObtained, exam.total_marks, percentage, grade, gradePoints, isAbsent, req.user._id]
      );
    }

    // Notify each affected student that results are out.
    // INSERT ... SELECT creates one notification row per student in a single query.
    const studentIds = [...new Set(marksData.map(m => String(m.studentId)))];
    if (studentIds.length > 0) {
      await query(
        `INSERT INTO notifications (recipient, type, title, message, related_id, related_model)
         SELECT s.user_id, 'marks_published', $2, $3, $1, 'Exam'
         FROM students s
         WHERE s.id = ANY($4::uuid[])`,
        [examId, "Marks Published", `Marks for ${exam.name} have been published. Check your results.`, studentIds]
      );
    }

    // Marks entered -> the exam is finished
    await query("UPDATE exams SET status = 'completed' WHERE id = $1", [examId]);
    res.json({ success: true, message: `Marks entered for ${marksData.length} students` });
  } catch (err) { next(err); }
});

// @route  GET /api/marks/report/:studentId/:examId
// Streams a downloadable PDF marksheet for one student + exam.
router.get("/report/:studentId/:examId", async (req, res, next) => {
  try {
    // One JOIN across all four tables to collect everything the PDF needs
    const { rows } = await query(
      `SELECT m.id AS "_id",
              m.theory_marks::float8 AS "theoryMarks",
              m.internal_marks::float8 AS "internalMarks",
              m.practical_marks::float8 AS "practicalMarks",
              m.total_obtained::float8 AS "totalObtained",
              m.total_maximum::float8 AS "totalMaximum",
              m.percentage::float8 AS "percentage",
              m.grade, m.grade_points::float8 AS "gradePoints",
              m.is_absent AS "isAbsent",
              s.id AS "studentId", s.roll_no AS "rollNo", s.department, s.semester,
              u.id AS "userId", u.name AS "userName", u.email AS "userEmail",
              e.id AS "examId", e.name AS "examName", e.type AS "examType", e.date AS "examDate",
              e.total_marks::float8 AS "examTotalMarks", e.passing_marks::float8 AS "examPassingMarks",
              c.id AS "courseId", c.name AS "courseName", c.code AS "courseCode", c.credits
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN users u ON u.id = s.user_id
       JOIN exams e ON e.id = m.exam_id
       JOIN courses c ON c.id = m.course_id
       WHERE m.student_id = $1 AND m.exam_id = $2`,
      [req.params.studentId, req.params.examId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Marks not found" });

    const r = rows[0];
    // Bundle the flat row into the nested object the PDF generator expects
    const marks = {
      _id: r._id,
      student: {
        _id: r.studentId,
        rollNo: r.rollNo,
        department: r.department,
        semester: r.semester,
        userId: { _id: r.userId, name: r.userName, email: r.userEmail }
      },
      exam: {
        _id: r.examId,
        name: r.examName,
        type: r.examType,
        date: r.examDate,
        totalMarks: r.examTotalMarks,
        passingMarks: r.examPassingMarks
      },
      course: { _id: r.courseId, name: r.courseName, code: r.courseCode, credits: r.credits },
      theoryMarks: r.theoryMarks,
      internalMarks: r.internalMarks,
      practicalMarks: r.practicalMarks,
      totalObtained: r.totalObtained,
      totalMaximum: r.totalMaximum,
      percentage: r.percentage,
      grade: r.grade,
      gradePoints: r.gradePoints,
      isAbsent: r.isAbsent
    };

    // Tell the browser "this response is a PDF file to download",
    // then pipe the generated document straight into the response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=marksheet-${req.params.studentId}.pdf`);
    generateMarksheet(marks, res);
  } catch (err) { next(err); }
});

module.exports = router;
