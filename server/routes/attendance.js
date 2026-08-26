// ============================================================
// routes/attendance.js
// All REST endpoints for the Attendance module: mark attendance
// for a whole class, view records with filters, per-student
// percentages, and today's dashboard summary.
// Every endpoint requires login; marking is admin/faculty only.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { query } = require("../config/db");

router.use(protect);

// POST /api/attendance/mark — bulk mark attendance
router.post("/mark", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { courseId, date, records, department, semester } = req.body;

    // If a faculty is marking, remember which faculty it was
    let facultyId = null;
    if (req.user.role === "faculty") {
      const fac = await query("SELECT id FROM faculties WHERE user_id = $1", [req.user._id]);
      if (fac.rows.length > 0) facultyId = fac.rows[0].id;
    }

    // UPSERT: if the student already has attendance for this
    // course+date, update it; otherwise insert a new row.
    for (const r of records) {
      await query(
        `INSERT INTO attendances (student_id, course_id, marked_by, date, status, department, semester, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text)
         ON CONFLICT (student_id, course_id, date)
         DO UPDATE SET
           status = EXCLUDED.status,
           remarks = CASE WHEN $8::text IS NULL THEN attendances.remarks ELSE EXCLUDED.remarks END`,
        [r.studentId, courseId, facultyId, date, r.status, department || null, semester != null ? parseInt(semester) : null, r.remarks ?? null]
      );
    }

    // Check low attendance for each student and create notifications
    for (const r of records) {
      // Count total classes and present classes for this student+course
      const stats = await query(
        `SELECT COUNT(*)::int AS total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::int AS present
         FROM attendances
         WHERE student_id = $1 AND course_id = $2`,
        [r.studentId, courseId]
      );
      if (stats.rows.length === 0 || stats.rows[0].total === 0) continue; // no data yet
      const { total, present } = stats.rows[0];
      const pct = (present / total) * 100;

      // Below 75% (with at least 5 classes recorded) -> warn the student.
      // Only one alert per student+course: update the existing
      // notification instead of spamming duplicates.
      if (pct < 75 && total >= 5) {
        const stu = await query("SELECT user_id FROM students WHERE id = $1", [r.studentId]);
        if (stu.rows.length > 0) {
          const recipient = stu.rows[0].user_id;
          const title = "Low Attendance Alert";
          const message = `Your attendance has dropped to ${pct.toFixed(1)}% in this subject. Minimum 75% required.`;
          const upd = await query(
            `UPDATE notifications SET title = $3, message = $4, is_read = false
             WHERE recipient = $1 AND type = 'low_attendance' AND related_id = $2`,
            [recipient, courseId, title, message]
          );
          // rowCount 0 means no existing alert -> insert a fresh one
          if (upd.rowCount === 0) {
            await query(
              `INSERT INTO notifications (recipient, type, title, message, related_id, is_read)
               VALUES ($1, 'low_attendance', $2, $3, $4, false)`,
              [recipient, title, message, courseId]
            );
          }
        }
      }
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (err) { next(err); }
});

// GET /api/attendance — with filters
// Optional query params: studentId, courseId, exact date,
// or month+year (converted to a first-day..last-day range).
router.get("/", async (req, res, next) => {
  try {
    const { studentId, courseId, month, year, date } = req.query;
    const params = [];
    const where = [];

    if (studentId) { params.push(studentId); where.push(`a.student_id = $${params.length}`); }
    if (courseId) { params.push(courseId); where.push(`a.course_id = $${params.length}`); }

    // Exact date wins; otherwise filter the whole month given by month+year
    if (date) {
      params.push(date);
      where.push(`a.date = $${params.length}`);
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
      params.push(`${y}-${String(m).padStart(2, "0")}-01`);
      where.push(`a.date >= $${params.length}`);
      params.push(`${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`);
      where.push(`a.date <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // JOINs pull in student and course names so the UI can show them directly
    const { rows } = await query(
      `SELECT a.id AS "_id", a.status, a.date, a.remarks, a.semester, a.department,
              s.id AS "studentId", s.roll_no AS "rollNo",
              u.name AS "studentName",
              c.id AS "courseId", c.code AS "courseCode", c.name AS "courseName"
       FROM attendances a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       JOIN courses c ON c.id = a.course_id
       ${whereSql}
       ORDER BY a.date DESC`,
      params
    );

    // Reshape flat rows into nested objects for the frontend
    const data = rows.map((r) => ({
      _id: r._id,
      status: r.status,
      date: r.date,
      remarks: r.remarks,
      semester: r.semester,
      department: r.department,
      student: { _id: r.studentId, rollNo: r.rollNo, userId: { name: r.studentName } },
      course: { _id: r.courseId, code: r.courseCode, name: r.courseName }
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/attendance/percentage/:studentId — per-subject breakdown
// GROUP BY course gives one row per subject with present/absent/
// leave counts and an overall percentage.
router.get("/percentage/:studentId", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.code AS "courseCode", c.name AS "courseName",
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::int AS present,
              COUNT(*)::int AS total,
              SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)::int AS absent,
              SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END)::int AS leave,
              ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric * 100 / COUNT(*), 2)::float8 AS percentage
       FROM attendances a
       JOIN courses c ON c.id = a.course_id
       WHERE a.student_id = $1
       GROUP BY c.code, c.name`,
      [req.params.studentId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/attendance/today — today's summary for dashboard
// One aggregate row: how many were marked today and % present.
router.get("/today", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0)::int AS present
       FROM attendances
       WHERE date = CURRENT_DATE`
    );
    const { total, present } = rows[0];
    res.json({ success: true, data: { total, present, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0 } });
  } catch (err) { next(err); }
});

module.exports = router;
