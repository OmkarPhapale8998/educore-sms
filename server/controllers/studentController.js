// ============================================================
// controllers/studentController.js
// CRUD logic for the Students module (list, view, create,
// update, delete, upload documents, attendance summary).
// Every student has a login row in "users" plus a profile row
// in "students" linked by user_id.
// ============================================================
const { query } = require("../config/db");
const bcrypt = require("bcryptjs");

// Shared SQL column list: student fields joined with their user account.
// Aliases turn snake_case DB names into camelCase for the frontend.
const STUDENT_SELECT = `
  s.id AS "_id",
  u.id AS "userId",
  u.name AS "user_name",
  u.email AS "user_email",
  u.phone AS "user_phone",
  u.photo AS "user_photo",
  s.roll_no AS "rollNo",
  s.department,
  s.semester,
  s.admission_year AS "admissionYear",
  s.guardian_name AS "guardianName",
  s.guardian_phone AS "guardianPhone",
  s.address,
  s.date_of_birth AS "dateOfBirth",
  s.gender,
  s.category,
  s.status,
  s.created_at AS "createdAt",
  s.updated_at AS "updatedAt"
`;

const STUDENT_FROM = `FROM students s JOIN users u ON u.id = s.user_id`;

// Assemble a student object matching the legacy Mongoose populated shape
// Turns one flat SQL row into the nested JSON the frontend expects
// (user details nested under userId).
const shapeStudent = (row, documents = []) => ({
  _id: row._id,
  userId: {
    _id: row.userId,
    name: row.user_name,
    email: row.user_email,
    phone: row.user_phone,
    photo: row.user_photo
  },
  rollNo: row.rollNo,
  department: row.department,
  semester: row.semester,
  admissionYear: row.admissionYear,
  guardianName: row.guardianName,
  guardianPhone: row.guardianPhone,
  address: row.address,
  dateOfBirth: row.dateOfBirth,
  gender: row.gender,
  category: row.category,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  documents
});

// Fetch all uploaded documents belonging to one student
const getDocuments = async (studentId) => {
  const { rows } = await query(
    `SELECT id AS "_id", name, path, uploaded_at AS "uploadedAt"
     FROM student_documents WHERE student_id = $1 ORDER BY uploaded_at ASC`,
    [studentId]
  );
  return rows;
};

// @desc   Get all students with filters, search, pagination
// @route  GET /api/students
// @access Admin, Faculty
exports.getStudents = async (req, res, next) => {
  try {
    const { department, semester, search, status, page = 1, limit = 20, admissionYear } = req.query;
    // Build the SQL dynamically: each filter adds a condition + a $n placeholder
    const params = [];
    const where = [];

    if (department) { params.push(department); where.push(`s.department = $${params.length}`); }
    if (semester) { params.push(parseInt(semester)); where.push(`s.semester = $${params.length}`); }
    if (status) { params.push(status); where.push(`s.status = $${params.length}`); }
    if (admissionYear) { params.push(parseInt(admissionYear)); where.push(`s.admission_year = $${params.length}`); }

    // Search matches name, email or roll number (ILIKE = case-insensitive)
    if (search) {
      const like = `%${search}%`;
      params.push(like);
      const n = params.length;
      where.push(`(u.name ILIKE $${n} OR u.email ILIKE $${n} OR s.roll_no ILIKE $${n})`);
    }

    // No filters -> no WHERE clause at all
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // First query just counts total matching rows (needed for pagination info)
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM students s JOIN users u ON u.id = s.user_id ${whereSql}`, params);
    const total = countRes.rows[0].total;

    // Add LIMIT/OFFSET placeholders to fetch only one page of results
    params.push(parseInt(limit));
    const limitN = params.length;
    params.push((parseInt(page) - 1) * parseInt(limit));
    const offsetN = params.length;

    const { rows } = await query(
      `SELECT ${STUDENT_SELECT} ${STUDENT_FROM} ${whereSql}
       ORDER BY s.created_at DESC
       LIMIT $${limitN} OFFSET $${offsetN}`,
      params
    );

    res.json({
      success: true,
      data: rows.map((r) => shapeStudent(r)),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) { next(err); }
};

// @desc   Get single student
// @route  GET /api/students/:id
// @access Admin, Faculty, Student (own)
exports.getStudent = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${STUDENT_SELECT} ${STUDENT_FROM} WHERE s.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    // Students can only view their own profile
    if (req.user.role === "student") {
      const mine = await query("SELECT id FROM students WHERE user_id = $1", [req.user._id]);
      if (mine.rows.length === 0 || mine.rows[0].id !== req.params.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    const documents = await getDocuments(req.params.id);
    res.json({ success: true, data: shapeStudent(rows[0], documents) });
  } catch (err) { next(err); }
};

// @desc   Create student (also creates User account)
// @route  POST /api/students
// @access Admin only
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name, email, phone, password,
      rollNo, department, semester, admissionYear,
      guardianName, guardianPhone, address, dateOfBirth, gender, category
    } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    // Default password if admin didn't specify one
    const hashed = await bcrypt.hash(password || "Student@123", 12);

    // Insert login account first so we get its id for the profile row
    const userRes = await query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, 'student', $4) RETURNING id`,
      [(name || "").trim(), cleanEmail, hashed, phone || ""]
    );
    const userId = userRes.rows[0].id;

    const studentRes = await query(
      `INSERT INTO students (user_id, roll_no, department, semester, admission_year, guardian_name, guardian_phone, address, date_of_birth, gender, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [userId, rollNo, department, parseInt(semester), parseInt(admissionYear), guardianName || "", guardianPhone || "", address || "", dateOfBirth || null, gender || null, category || null]
    );

    // Re-select with joins so the response looks like getStudent output
    const { rows } = await query(
      `SELECT ${STUDENT_SELECT} ${STUDENT_FROM} WHERE s.id = $1`,
      [studentRes.rows[0].id]
    );

    res.status(201).json({ success: true, message: "Student created successfully", data: shapeStudent(rows[0], []) });
  } catch (err) { next(err); }
};

// @desc   Update student
// @route  PUT /api/students/:id
// @access Admin only
exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, rollNo, department, semester,
            guardianName, guardianPhone, address, status } = req.body;

    // A student's data lives in two tables; find their user id first
    const existing = await query("SELECT user_id FROM students WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });
    const userId = existing.rows[0].user_id;

    // Update the users table only when name/email/phone were sent
    if (name || email || phone !== undefined) {
      await query(
        `UPDATE users SET name = COALESCE($2, name), email = COALESCE($3, email), phone = COALESCE($4, phone)
         WHERE id = $1`,
        [userId, name || null, email ? email.toLowerCase() : null, phone !== undefined && phone !== "" ? phone : null]
      );
    }

    // COALESCE keeps old values for fields that weren't sent
    await query(
      `UPDATE students SET
         roll_no = COALESCE($2, roll_no),
         department = COALESCE($3, department),
         semester = COALESCE($4, semester),
         guardian_name = COALESCE($5, guardian_name),
         guardian_phone = COALESCE($6, guardian_phone),
         address = COALESCE($7, address),
         status = COALESCE($8, status)
       WHERE id = $1`,
      [req.params.id, rollNo || null, department || null, semester ? parseInt(semester) : null,
       guardianName ?? null, guardianPhone ?? null, address ?? null, status || null]
    );

    // Return the fresh combined record
    const { rows } = await query(
      `SELECT ${STUDENT_SELECT} ${STUDENT_FROM} WHERE s.id = $1`,
      [req.params.id]
    );

    res.json({ success: true, message: "Student updated", data: shapeStudent(rows[0]) });
  } catch (err) { next(err); }
};

// @desc   Delete student
// @route  DELETE /api/students/:id
// @access Admin only
exports.deleteStudent = async (req, res, next) => {
  try {
    const existing = await query("SELECT user_id FROM students WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    // Deleting the user cascades to student profile + attendance/fees/marks/documents
    await query("DELETE FROM users WHERE id = $1", [existing.rows[0].user_id]);

    res.json({ success: true, message: "Student deleted" });
  } catch (err) { next(err); }
};

// @desc   Upload student document
// @route  POST /api/students/:id/documents
// @access Admin only
exports.uploadDocument = async (req, res, next) => {
  try {
    // multer put the file on req.file; nothing there means upload failed
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const exists = await query("SELECT id FROM students WHERE id = $1", [req.params.id]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    // Save file metadata (not the bytes) in the database
    await query(
      `INSERT INTO student_documents (student_id, name, path)
       VALUES ($1, $2, $3)`,
      [req.params.id, req.body.name || req.file.originalname, req.file.path.replace(/\\/g, "/")]
    );

    const documents = await getDocuments(req.params.id);
    const { rows } = await query(
      `SELECT ${STUDENT_SELECT} ${STUDENT_FROM} WHERE s.id = $1`,
      [req.params.id]
    );

    res.json({ success: true, message: "Document uploaded", data: shapeStudent(rows[0], documents) });
  } catch (err) { next(err); }
};

// @desc   Get student attendance summary
// @route  GET /api/students/:id/attendance-summary
// @access Admin, Faculty, Student (own)
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    // GROUP BY course -> one summary row per subject:
    // count all classes, count 'present' ones, then compute percentage
    const { rows } = await query(
      `SELECT c.code AS "courseCode", c.name AS "courseName",
              COUNT(*)::int AS total,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::int AS present,
              ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric * 100 / COUNT(*))::float8 AS percentage
       FROM attendances a
       JOIN courses c ON c.id = a.course_id
       WHERE a.student_id = $1
       GROUP BY c.code, c.name`,
      [req.params.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
