// ============================================================
// routes/faculty.js
// All REST endpoints for the Faculty module (list, view,
// create, update, delete teachers). Handlers live right here
// instead of a separate controller file.
// Every endpoint requires login; writes are admin only.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");

router.use(protect);

// Shared SQL column list: faculty profile joined with their user account
const FACULTY_SELECT = `
  f.id AS "_id",
  u.id AS "userId",
  u.name AS "user_name",
  u.email AS "user_email",
  u.phone AS "user_phone",
  u.photo AS "user_photo",
  f.employee_id AS "employeeId",
  f.department,
  f.designation,
  f.qualification,
  f.status,
  f.created_at AS "createdAt"
`;

const FACULTY_FROM = `FROM faculties f JOIN users u ON u.id = f.user_id`;

// Turn one flat SQL row into the nested JSON shape the frontend expects
const shapeFaculty = (row, subjectsAssigned) => ({
  _id: row._id,
  userId: {
    _id: row.userId,
    name: row.user_name,
    email: row.user_email,
    phone: row.user_phone,
    photo: row.user_photo
  },
  employeeId: row.employeeId,
  department: row.department,
  designation: row.designation,
  qualification: row.qualification || [],
  subjectsAssigned: subjectsAssigned || [],
  status: row.status
});

// Fetch the courses assigned to many faculties in ONE query and
// return them as a Map: facultyId -> list of courses.
// ANY($1) matches an array of ids; `detail` adds dept/semester fields.
const getSubjectsMap = async (facultyIds, detail) => {
  const map = new Map();
  if (!facultyIds.length) return map;
  const { rows } = await query(
    `SELECT fc.faculty_id AS "facultyId", c.id AS "_id", c.code, c.name${
      detail ? ", c.department, c.semester" : ""
    }
     FROM faculty_courses fc JOIN courses c ON c.id = fc.course_id
     WHERE fc.faculty_id = ANY($1)
     ORDER BY c.code`,
    [facultyIds]
  );
  // Group the rows under each faculty id
  rows.forEach((r) => {
    const list = map.get(r.facultyId) || [];
    const item = { _id: r._id, code: r.code, name: r.name };
    if (detail) {
      item.department = r.department;
      item.semester = r.semester;
    }
    list.push(item);
    map.set(r.facultyId, list);
  });
  return map;
};

// @route  GET /api/faculty
// Lists all teachers with optional filters (department/status/search)
// and optional pagination via ?page & ?limit.
router.get("/", authorize("admin", "faculty", "student"), async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit } = req.query;
    // Build SQL conditions dynamically from whatever filters were sent
    const params = [];
    const where = [];

    if (department) { params.push(department); where.push(`f.department = $${params.length}`); }
    if (status) { params.push(status); where.push(`f.status = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      where.push(`(u.name ILIKE $${n} OR u.email ILIKE $${n} OR f.employee_id ILIKE $${n})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // LIMIT/OFFSET added only when ?limit is provided
    let sql = `SELECT ${FACULTY_SELECT} ${FACULTY_FROM} ${whereSql} ORDER BY f.created_at DESC`;
    if (limit) {
      params.push(parseInt(limit));
      sql += ` LIMIT $${params.length}`;
      params.push((parseInt(page) - 1) * parseInt(limit));
      sql += ` OFFSET $${params.length}`;
    }

    const { rows } = await query(sql, params);
    // One extra query fetches every faculty's subjects at once
    const subjects = await getSubjectsMap(rows.map((r) => r._id), false);

    res.json({
      success: true,
      data: rows.map((r) => shapeFaculty(r, subjects.get(r._id) || []))
    });
  } catch (err) { next(err); }
});

// @route  GET /api/faculty/:id
// Returns one teacher's full profile including detailed subject info.
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${FACULTY_SELECT} ${FACULTY_FROM} WHERE f.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Faculty not found" });

    const subjects = await getSubjectsMap([rows[0]._id], true);
    res.json({ success: true, data: shapeFaculty(rows[0], subjects.get(rows[0]._id) || []) });
  } catch (err) { next(err); }
});

// @route  POST /api/faculty   Add a new teacher (admin only)
// Creates BOTH a login (users row) and a profile (faculties row).
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, password, employeeId, department, designation, qualification, joiningDate } = req.body;

    // Default password if admin didn't provide one
    const hashed = await bcrypt.hash(password || "Faculty@1234", 12);

    const userRes = await query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, 'faculty', $4)
       RETURNING id`,
      [(name || "").trim(), (email || "").trim().toLowerCase(), hashed, phone || ""]
    );
    const userId = userRes.rows[0].id;

    const facultyRes = await query(
      `INSERT INTO faculties (user_id, employee_id, department, designation, qualification, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        employeeId,
        department || null,
        designation || null,
        Array.isArray(qualification) ? qualification : [],
        joiningDate || null
      ]
    );

    // Re-select with joins so the response matches the other endpoints' shape
    const { rows } = await query(
      `SELECT ${FACULTY_SELECT} ${FACULTY_FROM} WHERE f.id = $1`,
      [facultyRes.rows[0].id]
    );

    res.status(201).json({ success: true, message: "Faculty created", data: shapeFaculty(rows[0], []) });
  } catch (err) { next(err); }
});

// @route  PUT /api/faculty/:id   Update a teacher (admin only)
// Can also replace the whole list of subjects they teach.
router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, department, designation, qualification, status, subjectsAssigned } = req.body;

    // Find the linked login account first
    const existing = await query("SELECT user_id FROM faculties WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: "Faculty not found" });
    const userId = existing.rows[0].user_id;

    // Update users table when name/email/phone were sent (COALESCE keeps old values otherwise)
    if (name || email || phone) {
      await query(
        `UPDATE users SET name = COALESCE($2, name), email = COALESCE($3, email), phone = COALESCE($4, phone)
         WHERE id = $1`,
        [userId, name || null, email ? email.toLowerCase() : null, phone || null]
      );
    }

    await query(
      `UPDATE faculties SET
         department = COALESCE($2, department),
         designation = COALESCE($3, designation),
         qualification = COALESCE($4, qualification),
         status = COALESCE($5, status)
       WHERE id = $1`,
      [req.params.id, department || null, designation || null, Array.isArray(qualification) ? qualification : null, status || null]
    );

    // Replace subject assignments: delete all old links, insert the new list.
    // unnest() turns the JS array into rows for a single bulk INSERT.
    if (Array.isArray(subjectsAssigned)) {
      await query("DELETE FROM faculty_courses WHERE faculty_id = $1", [req.params.id]);
      if (subjectsAssigned.length) {
        await query(
          `INSERT INTO faculty_courses (faculty_id, course_id)
           SELECT $1, x FROM unnest($2::uuid[]) AS x`,
          [req.params.id, subjectsAssigned]
        );
      }
    }

    const { rows } = await query(
      `SELECT ${FACULTY_SELECT} ${FACULTY_FROM} WHERE f.id = $1`,
      [req.params.id]
    );
    const subjects = await getSubjectsMap([req.params.id], false);

    res.json({ success: true, data: shapeFaculty(rows[0], subjects.get(req.params.id) || []) });
  } catch (err) { next(err); }
});

// @route  DELETE /api/faculty/:id   Remove a teacher (admin only)
// Deleting the linked user cascades to the faculties profile row.
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const existing = await query("SELECT user_id FROM faculties WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: "Faculty not found" });

    await query("DELETE FROM users WHERE id = $1", [existing.rows[0].user_id]);

    res.json({ success: true, message: "Faculty deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
