// ============================================================
// routes/courses.js
// All REST endpoints for the Courses module: list, view,
// create, update, delete courses, edit syllabus units and
// upload a syllabus file.
// Every endpoint requires login; writes need admin/faculty.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { query } = require("../config/db");

router.use(protect);

// Shared SQL column list. LEFT JOINs keep courses that have no
// faculty assigned yet (their faculty columns come back NULL).
const COURSE_SELECT = `
  c.id AS "_id",
  c.code,
  c.name,
  c.type,
  c.department,
  c.semester,
  c.credits,
  f2.id AS "facultyId",
  f2.designation AS "facultyDesignation",
  u2.name AS "facultyName",
  u2.email AS "facultyEmail",
  c.syllabus_file AS "syllabusFile",
  c.is_active AS "isActive"
`;

const COURSE_FROM = `FROM courses c
  LEFT JOIN faculties f2 ON f2.id = c.assigned_faculty_id
  LEFT JOIN users u2 ON u2.id = f2.user_id`;

// Turn one flat SQL row into the nested JSON shape (faculty + syllabus units)
const shapeCourse = (row, units, detail = false) => ({
  _id: row._id,
  code: row.code,
  name: row.name,
  type: row.type,
  department: row.department,
  semester: row.semester,
  credits: row.credits,
  assignedFaculty: row.facultyId
    ? {
        _id: row.facultyId,
        designation: row.facultyDesignation,
        userId: detail
          ? { name: row.facultyName, email: row.facultyEmail }
          : { name: row.facultyName }
      }
    : null,
  syllabusUnits: units || [],
  syllabusFile: row.syllabusFile,
  isActive: row.isActive
});

// Fetch syllabus units for MANY courses in one query,
// returned as a Map: courseId -> list of units.
const getUnitsMap = async (courseIds) => {
  const map = new Map();
  if (!courseIds.length) return map;
  const { rows } = await query(
    `SELECT id AS "_id", course_id AS "courseId", title, description, completed
     FROM syllabus_units WHERE course_id = ANY($1)
     ORDER BY course_id, position`,
    [courseIds]
  );
  // Group the rows under their course id
  rows.forEach((r) => {
    const list = map.get(r.courseId) || [];
    list.push({ _id: r._id, title: r.title, description: r.description, completed: r.completed });
    map.set(r.courseId, list);
  });
  return map;
};

// @route  GET /api/courses
// Lists courses with filters (department/semester/search) and pagination;
// each course includes its syllabus units.
router.get("/", async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 20 } = req.query;
    // Build SQL conditions dynamically from the filters sent
    const params = [];
    const where = [];

    if (department) { params.push(department); where.push(`c.department = $${params.length}`); }
    if (semester) { params.push(parseInt(semester)); where.push(`c.semester = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      where.push(`(c.name ILIKE $${n} OR c.code ILIKE $${n})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // LIMIT/OFFSET placeholders for pagination
    params.push(parseInt(limit));
    const limitN = params.length;
    params.push((parseInt(page) - 1) * parseInt(limit));
    const offsetN = params.length;

    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT $${limitN} OFFSET $${offsetN}`,
      params
    );

    // Attach units to each course from the single shared query result
    const units = await getUnitsMap(rows.map((r) => r._id));

    res.json({ success: true, data: rows.map((r) => shapeCourse(r, units.get(r._id) || [])) });
  } catch (err) { next(err); }
});

// @route  GET /api/courses/:id
// One course's full details including its syllabus units.
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} WHERE c.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Course not found" });

    const units = await getUnitsMap([req.params.id]);
    res.json({ success: true, data: shapeCourse(rows[0], units.get(req.params.id) || [], true) });
  } catch (err) { next(err); }
});

// @route  POST /api/courses   Create a new course (admin only)
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, code, department, semester, credits, type, assignedFaculty } = req.body;

    let created;
    try {
      created = await query(
        `INSERT INTO courses (name, code, department, semester, credits, type, assigned_faculty_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          name,
          code,
          department || null,
          semester ? parseInt(semester) : null,
          credits ? parseInt(credits) : null,
          type || null,
          assignedFaculty || null
        ]
      );
    } catch (e) {
      // Postgres code 23505 = duplicate unique value (the course code)
      if (e.code === "23505") return res.status(400).json({ success: false, message: "Course code already exists" });
      throw e;
    }

    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} WHERE c.id = $1`,
      [created.rows[0].id]
    );

    res.status(201).json({ success: true, message: "Course created", data: shapeCourse(rows[0], []) });
  } catch (err) { next(err); }
});

// @route  PUT /api/courses/:id   Update a course (admin or faculty)
// Builds the UPDATE statement dynamically so only sent fields change.
router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const exists = await query("SELECT id FROM courses WHERE id = $1", [req.params.id]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: "Course not found" });

    // body field -> DB column for text fields...
    const fields = {
      name: "name",
      code: "code",
      department: "department",
      type: "type",
      assignedFaculty: "assigned_faculty_id",
      syllabusFile: "syllabus_file",
      isActive: "is_active"
    };
    // ...and ones that must be converted to numbers first
    const numerics = { semester: "semester", credits: "credits" };
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
      try {
        await query(`UPDATE courses SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
      } catch (e) {
        if (e.code === "23505") return res.status(400).json({ success: false, message: "Course code already exists" });
        throw e;
      }
    }

    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} WHERE c.id = $1`,
      [req.params.id]
    );
    const units = await getUnitsMap([req.params.id]);

    res.json({ success: true, data: shapeCourse(rows[0], units.get(req.params.id) || []) });
  } catch (err) { next(err); }
});

// @route  PATCH /api/courses/:id/syllabus-unit/:unitId
// Update a single syllabus unit (title/description/completed)
// — used by teachers to tick off finished topics.
router.patch("/:id/syllabus-unit/:unitId", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const course = await query("SELECT id FROM courses WHERE id = $1", [req.params.id]);
    if (course.rows.length === 0) return res.status(404).json({ success: false, message: "Course not found" });

    // The unit must belong to this specific course
    const unit = await query("SELECT id FROM syllabus_units WHERE id = $1 AND course_id = $2", [
      req.params.unitId,
      req.params.id
    ]);
    if (unit.rows.length === 0) return res.status(404).json({ success: false, message: "Unit not found" });

    // Same dynamic-update pattern as above, for unit fields
    const fields = { title: "title", description: "description", completed: "completed" };
    const sets = [];
    const params = [];

    for (const key of Object.keys(fields)) {
      if (req.body[key] !== undefined) {
        params.push(req.body[key]);
        sets.push(`${fields[key]} = $${params.length}`);
      }
    }

    if (sets.length) {
      params.push(req.params.unitId);
      params.push(req.params.id);
      await query(
        `UPDATE syllabus_units SET ${sets.join(", ")} WHERE id = $${params.length - 1} AND course_id = $${params.length}`,
        params
      );
    }

    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} WHERE c.id = $1`,
      [req.params.id]
    );
    const units = await getUnitsMap([req.params.id]);

    res.json({ success: true, data: shapeCourse(rows[0], units.get(req.params.id) || []) });
  } catch (err) { next(err); }
});

// @route  POST /api/courses/:id/syllabus
// Uploads a syllabus PDF/file and saves its path on the course.
router.post("/:id/syllabus", authorize("admin", "faculty"), upload.single("syllabus"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    await query("UPDATE courses SET syllabus_file = $2 WHERE id = $1", [
      req.params.id,
      req.file.path.replace(/\\/g, "/")
    ]);

    const { rows } = await query(
      `SELECT ${COURSE_SELECT} ${COURSE_FROM} WHERE c.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ success: true, data: null });

    const units = await getUnitsMap([req.params.id]);
    res.json({ success: true, data: shapeCourse(rows[0], units.get(req.params.id) || []) });
  } catch (err) { next(err); }
});

// @route  DELETE /api/courses/:id   Delete a course (admin only)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await query("DELETE FROM courses WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
