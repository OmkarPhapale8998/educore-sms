// ============================================================
// routes/reports.js
// Analytics + export endpoints for dashboards: enrollment
// trends, department distribution, pass rates, summary cards,
// and an Excel export of all students.
// Admin and faculty only (checked once for every route below).
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { query } = require("../config/db");
const { generateExcelReport } = require("../utils/excelGenerator");

router.use(protect, authorize("admin", "faculty"));

// @route  GET /api/reports/enrollment-trend
// Students per admission year — data for the line/bar chart.
// GROUP BY year collapses rows into one count per year.
router.get("/enrollment-trend", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT admission_year AS year, COUNT(*)::int AS count
       FROM students
       GROUP BY admission_year
       ORDER BY admission_year ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// @route  GET /api/reports/department-distribution
// Active students per department — data for the pie chart.
router.get("/department-distribution", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT department, COUNT(*)::int AS count
       FROM students
       WHERE status = 'active' AND department IS NOT NULL
       GROUP BY department
       ORDER BY department ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// @route  GET /api/reports/pass-rate
// Pass percentage per exam. A student "passes" when their grade
// is anything except F; optional ?examId limits to one exam.
router.get("/pass-rate", async (req, res, next) => {
  try {
    const { examId } = req.query;
    const params = [];
    let where = "";
    if (examId) {
      params.push(examId);
      where = `WHERE m.exam_id = $1`;
    }

    // CASE WHEN counts passers; ROUND gives one decimal place
    const { rows } = await query(
      `SELECT e.name AS "examName",
              COUNT(*)::int AS total,
              SUM(CASE WHEN m.grade <> 'F' THEN 1 ELSE 0 END)::int AS passed,
              ROUND(SUM(CASE WHEN m.grade <> 'F' THEN 1 ELSE 0 END)::numeric * 100 / COUNT(*), 1)::float8 AS "passRate"
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       ${where}
       GROUP BY e.name
       ORDER BY e.name ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// @route  GET /api/reports/dashboard-summary
// Three headline numbers for the admin dashboard:
// total students, total faculty, today's attendance %.
// Promise.all runs the three queries at the same time.
router.get("/dashboard-summary", async (req, res, next) => {
  try {
    const [studentRes, facultyRes, attRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM students WHERE status = 'active'`),
      query(`SELECT COUNT(*)::int AS total FROM faculties WHERE status = 'active'`),
      query(`SELECT SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::int AS present,
                    SUM(CASE WHEN status IN ('present', 'absent') THEN 1 ELSE 0 END)::int AS counted
             FROM attendances
             WHERE date = current_date`)
    ]);

    const att = attRes.rows[0];
    // 'counted' excludes 'leave' so on-leave students don't drag the % down

    res.json({
      success: true,
      data: {
        totalStudents: studentRes.rows[0].total,
        totalFaculty: facultyRes.rows[0].total,
        todayAttendancePercent: att.counted > 0 ? parseFloat(((att.present / att.counted) * 100).toFixed(1)) : 0
      }
    });
  } catch (err) { next(err); }
});

// @route  GET /api/reports/export/students
// Downloads every student (with filters) as an Excel .xlsx file.
router.get("/export/students", async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    // Optional filters built dynamically like elsewhere
    const params = [];
    const where = [];
    if (department) { params.push(department); where.push(`s.department = $${params.length}`); }
    if (semester) { params.push(parseInt(semester)); where.push(`s.semester = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT s.id AS "_id", s.user_id AS "userId",
              u.name AS "userName", u.email AS "userEmail", u.phone AS "userPhone",
              s.roll_no AS "rollNo", s.department, s.semester,
              s.admission_year AS "admissionYear", s.status
       FROM students s
       JOIN users u ON u.id = s.user_id
       ${whereSql}
       ORDER BY s.created_at DESC`,
      params
    );

    // Reshape into the nested objects the Excel generator expects
    const students = rows.map(r => ({
      _id: r._id,
      rollNo: r.rollNo,
      userId: { _id: r.userId, name: r.userName, email: r.userEmail, phone: r.userPhone },
      department: r.department,
      semester: r.semester,
      admissionYear: r.admissionYear,
      status: r.status
    }));

    // Tell the browser this response should be saved as a file,
    // then stream the workbook directly into it
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=students-report.xlsx");
    await generateExcelReport(students, res);
  } catch (err) { next(err); }
});

module.exports = router;
