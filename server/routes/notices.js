// ============================================================
// routes/notices.js
// All REST endpoints for the Notices module (announcement
// board): list, view, post, edit, pin and delete notices.
// Every endpoint requires login; posting/editing is limited
// to admin and faculty.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { query } = require("../config/db");

router.use(protect);

// Shared SQL column list; LEFT JOIN keeps notices whose author was deleted
const NOTICE_SELECT = `
  n.id AS "_id", n.title, n.description, n.category,
  u.id AS "postedById", u.name AS "postedByName", u.role AS "postedByRole",
  n.target_audience AS "targetAudience", n.department,
  n.attachment_name AS "attachmentName", n.attachment_path AS "attachmentPath",
  n.is_pinned AS "isPinned", n.is_published AS "isPublished",
  n.expires_at AS "expiresAt", n.created_at AS "createdAt", n.updated_at AS "updatedAt"
`;

const NOTICE_FROM = `FROM notices n LEFT JOIN users u ON u.id = n.posted_by`;

// Turn one flat SQL row into the nested JSON shape the frontend expects
const shapeNotice = (row) => ({
  _id: row._id,
  title: row.title,
  description: row.description,
  category: row.category,
  postedBy: row.postedById ? { _id: row.postedById, name: row.postedByName, role: row.postedByRole } : null,
  targetAudience: row.targetAudience,
  department: row.department,
  attachment: row.attachmentName && row.attachmentPath ? { name: row.attachmentName, path: row.attachmentPath } : null,
  isPinned: row.isPinned,
  isPublished: row.isPublished,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

// Accept booleans sent as real true OR as the string "true" (from form data)
const toBool = (v) => v === true || v === "true";

// @route  GET /api/notices
// Public notice board: only published, non-expired notices,
// with optional filters + pagination. Pinned ones come first.
router.get("/", async (req, res, next) => {
  try {
    const { category, targetAudience, search, pinned, page = 1, limit = 20 } = req.query;
    // Base conditions everyone gets: published AND not expired yet
    const params = [];
    const where = ["n.is_published = true", "(n.expires_at IS NULL OR n.expires_at > now())"];

    // Extra filters are appended only when provided
    if (category) { params.push(category); where.push(`n.category = $${params.length}`); }
    if (targetAudience) { params.push(targetAudience); where.push(`n.target_audience IN ($${params.length}, 'all')`); } // 'all' notices show for everyone
    if (pinned === "true") { params.push(true); where.push(`n.is_pinned = $${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`n.title ILIKE $${params.length}`); }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    // Count first so we can report total pages
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM notices n ${whereSql}`, params);
    const total = countRes.rows[0].total;

    // LIMIT/OFFSET placeholders for pagination
    params.push(parseInt(limit));
    const limitN = params.length;
    params.push((parseInt(page) - 1) * parseInt(limit));
    const offsetN = params.length;

    // Pinned notices jump to the top, then newest first
    const { rows } = await query(
      `SELECT ${NOTICE_SELECT} ${NOTICE_FROM} ${whereSql}
       ORDER BY n.is_pinned DESC, n.created_at DESC
       LIMIT $${limitN} OFFSET $${offsetN}`,
      params
    );

    res.json({
      success: true,
      data: rows.map(shapeNotice),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
});

// @route  GET /api/notices/:id
// One notice's full details.
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${NOTICE_SELECT} ${NOTICE_FROM} WHERE n.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: shapeNotice(rows[0]) });
  } catch (err) { next(err); }
});

// @route  POST /api/notices   Post a new notice (admin/faculty)
// Also creates in-app notifications for the target audience.
router.post("/", authorize("admin", "faculty"), upload.single("attachment"), async (req, res, next) => {
  try {
    const { title, description, category, targetAudience, department, isPinned, isPublished, expiresAt } = req.body;
    // Default expiry: auto-hide after 30 days if no date given
    const finalExpiresAt = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const insertRes = await query(
      `INSERT INTO notices (title, description, category, posted_by, target_audience, department,
                            attachment_name, attachment_path, is_pinned, is_published, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id AS "_id", title, description, category, posted_by AS "postedById",
                 target_audience AS "targetAudience", department,
                 attachment_name AS "attachmentName", attachment_path AS "attachmentPath",
                 is_pinned AS "isPinned", is_published AS "isPublished",
                 expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        title,
        description,
        category || "General",
        req.user._id, // who posted it
        targetAudience || "all",
        department || "all",
        req.file ? req.file.originalname : null,
        req.file ? req.file.path.replace(/\\/g, "/") : null,
        toBool(isPinned),
        isPublished === undefined ? true : toBool(isPublished),
        finalExpiresAt
      ]
    );

    // Fill in author info from the logged-in user for the response
    const notice = shapeNotice({ ...insertRes.rows[0], postedByName: req.user.name, postedByRole: req.user.role });

    // Notify users about the new notice:
    // targeted -> one INSERT per matching role; otherwise notify every user.
    // INSERT ... SELECT creates all the rows in a single query.
    const roleFilter = targetAudience === "students" ? "student" : targetAudience === "faculty" ? "faculty" : null;
    if (roleFilter) {
      await query(
        `INSERT INTO notifications (recipient, type, title, message, related_id, related_model)
         SELECT u.id, 'new_notice', $1, $2, $3, 'Notice' FROM users u WHERE u.role = $4`,
        ["New Notice Posted", notice.title, notice._id, roleFilter]
      );
    } else {
      await query(
        `INSERT INTO notifications (recipient, type, title, message, related_id, related_model)
         SELECT u.id, 'new_notice', $1, $2, $3, 'Notice' FROM users u`,
        ["New Notice Posted", notice.title, notice._id]
      );
    }

    res.status(201).json({ success: true, message: "Notice posted", data: notice });
  } catch (err) { next(err); }
});

// @route  PUT /api/notices/:id   Edit an existing notice (admin/faculty)
// Builds the UPDATE statement dynamically so only sent fields change.
router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    // body field -> DB column
    const colMap = {
      title: "title",
      description: "description",
      category: "category",
      targetAudience: "target_audience",
      department: "department",
      isPinned: "is_pinned",
      isPublished: "is_published",
      expiresAt: "expires_at"
    };
    // Boolean columns need string "true"/"false" converted first
    const boolKeys = new Set(["isPinned", "isPublished"]);
    const sets = [];
    const params = [];
    for (const key of Object.keys(colMap)) {
      if (req.body[key] !== undefined) {
        params.push(boolKeys.has(key) ? toBool(req.body[key]) : req.body[key]);
        sets.push(`${colMap[key]} = $${params.length}`);
      }
    }
    if (sets.length > 0) {
      params.push(req.params.id);
      await query(`UPDATE notices SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    }
    const { rows } = await query(`SELECT ${NOTICE_SELECT} ${NOTICE_FROM} WHERE n.id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: shapeNotice(rows[0]) });
  } catch (err) { next(err); }
});

// @route  PATCH /api/notices/:id/pin   Toggle pin on/off (admin only)
// "NOT is_pinned" flips true->false / false->true in one statement
router.patch("/:id/pin", authorize("admin"), async (req, res, next) => {
  try {
    const pinRes = await query(
      `UPDATE notices SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING is_pinned AS "isPinned"`,
      [req.params.id]
    );
    if (pinRes.rows.length === 0) return res.status(404).json({ success: false, message: "Notice not found" });

    const { rows } = await query(`SELECT ${NOTICE_SELECT} ${NOTICE_FROM} WHERE n.id = $1`, [req.params.id]);
    res.json({
      success: true,
      data: shapeNotice(rows[0]),
      message: pinRes.rows[0].isPinned ? "Notice pinned" : "Notice unpinned"
    });
  } catch (err) { next(err); }
});

// @route  DELETE /api/notices/:id   Delete a notice (admin only)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await query("DELETE FROM notices WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
