// ============================================================
// routes/exams.js
// All REST endpoints for the Exams module: list, view,
// schedule, update and delete exams.
// Every endpoint requires login; writes are admin only.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { query } = require("../config/db");

router.use(protect);

// Shared SQL column list; LEFT JOIN keeps exams that have no course linked
const EXAM_SELECT = `
  e.id AS "_id",
  e.name,
  e.type,
  e.status,
  e.department,
  e.semester,
  e.date,
  e.start_time AS "startTime",
  e.end_time AS "endTime",
  e.room,
  e.total_marks::int AS "totalMarks",
  e.passing_marks::int AS "passingMarks",
  e.instructions,
  c.id AS "courseId",
  c.code AS "courseCode",
  c.name AS "courseName",
  c.credits AS "courseCredits"
`;

const EXAM_FROM = `FROM exams e LEFT JOIN courses c ON c.id = e.course_id`;

// Turn one flat SQL row into the nested JSON shape (course object inside)
const shapeExam = (row, detail = false) => ({
  _id: row._id,
  name: row.name,
  type: row.type,
  status: row.status,
  department: row.department,
  semester: row.semester,
  date: row.date,
  startTime: row.startTime,
  endTime: row.endTime,
  room: row.room,
  totalMarks: row.totalMarks,
  passingMarks: row.passingMarks,
  instructions: row.instructions,
  course: row.courseId
    ? {
        _id: row.courseId,
        code: row.courseCode,
        name: row.courseName,
        ...(detail ? { credits: row.courseCredits } : {})
      }
    : null
});

// @route  GET /api/exams
// Lists exams with optional filters (department/semester/type/status)
// and an optional ?limit for the newest N results.
router.get("/", async (req, res, next) => {
  try {
    const { department, semester, type, status, limit } = req.query;
    // Build SQL conditions dynamically from the filters sent
    const params = [];
    const where = [];

    if (department) { params.push(department); where.push(`e.department = $${params.length}`); }
    if (semester) { params.push(parseInt(semester)); where.push(`e.semester = $${params.length}`); }
    if (type) { params.push(type); where.push(`e.type = $${params.length}`); }
    if (status) { params.push(status); where.push(`e.status = $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let sql = `SELECT ${EXAM_SELECT} ${EXAM_FROM} ${whereSql} ORDER BY e.date DESC`;
    if (limit) {
      params.push(parseInt(limit));
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await query(sql, params);
    res.json({ success: true, data: rows.map((r) => shapeExam(r)) });
  } catch (err) { next(err); }
});

// @route  GET /api/exams/:id
// One exam's full details.
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${EXAM_SELECT} ${EXAM_FROM} WHERE e.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Exam not found" });

    res.json({ success: true, data: shapeExam(rows[0], true) });
  } catch (err) { next(err); }
});

// @route  POST /api/exams   Schedule a new exam (admin only)
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, type, course, department, semester, date, startTime, endTime, room, totalMarks, passingMarks, instructions } = req.body;

    const inserted = await query(
      `INSERT INTO exams (name, type, course_id, department, semester, date, start_time, end_time, room, total_marks, passing_marks, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        name || null,
        type || null,
        course || null,
        department || null,
        semester ? parseInt(semester) : null,
        date || null,
        startTime || null,
        endTime || null,
        room || null,
        totalMarks ? parseInt(totalMarks) : null,
        passingMarks ? parseInt(passingMarks) : null,
        instructions || null
      ]
    );

    // Re-select with joins so the response matches the other endpoints' shape
    const { rows } = await query(
      `SELECT ${EXAM_SELECT} ${EXAM_FROM} WHERE e.id = $1`,
      [inserted.rows[0].id]
    );

    res.status(201).json({ success: true, message: "Exam scheduled", data: shapeExam(rows[0]) });
  } catch (err) { next(err); }
});

// @route  PUT /api/exams/:id   Update an exam (admin only)
// Builds the UPDATE statement dynamically so only sent fields change.
router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const exists = await query("SELECT id FROM exams WHERE id = $1", [req.params.id]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: "Exam not found" });

    // body field -> DB column for text fields...
    const fields = {
      name: "name",
      type: "type",
      course: "course_id",
      department: "department",
      date: "date",
      startTime: "start_time",
      endTime: "end_time",
      room: "room",
      status: "status",
      instructions: "instructions"
    };
    // ...and ones that must be converted to numbers first
    const numerics = { semester: "semester", totalMarks: "total_marks", passingMarks: "passing_marks" };
    const sets = [];
    const params = [];

    // Add "column = $n" only for fields present in the request body
    for (const key of Object.keys(fields)) {
      if (req.body[key] !== undefined) {
        params.push(req.body[key]);
        sets.push(`${fields[key]} = $${params.length}`);
      }
    }
    for (const key of Object.keys(numerics)) {
      if (req.body[key] !== undefined) {
        params.push(parseInt(req.body[key]));
        sets.push(`${numerics[key]} = $${params.length}`);
      }
    }

    if (sets.length) {
      params.push(req.params.id);
      await query(`UPDATE exams SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    }

    const { rows } = await query(
      `SELECT ${EXAM_SELECT} ${EXAM_FROM} WHERE e.id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: shapeExam(rows[0]) });
  } catch (err) { next(err); }
});

// @route  DELETE /api/exams/:id   Delete an exam (admin only)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await query("DELETE FROM exams WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Exam deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
