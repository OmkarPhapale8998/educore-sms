// ============================================================
// routes/notifications.js
// REST endpoints for the in-app notification bell: fetch your
// own notifications, mark one as read, or mark all as read.
// Every user only ever sees their OWN notifications.
// ============================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { query } = require("../config/db");

router.use(protect);

// @route  GET /api/notifications/me
// The logged-in user's 50 newest notifications + how many are unread.
router.get("/me", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id AS "_id", title, message, type,
              is_read AS "isRead", created_at AS "createdAt"
       FROM notifications
       WHERE recipient = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user._id]
    );
    // Separate tiny query just for the unread badge count
    const countRes = await query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE recipient = $1 AND is_read = false`,
      [req.user._id]
    );
    res.json({ success: true, data: rows, unreadCount: countRes.rows[0].unread });
  } catch (err) { next(err); }
});

// @route  PATCH /api/notifications/:id/read
// Marks ONE notification as read. Checking recipient = me stops
// users from marking other people's notifications.
router.patch("/:id/read", async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true, read_at = now() WHERE id = $1 AND recipient = $2`,
      [req.params.id, req.user._id]
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { next(err); }
});

// @route  PATCH /api/notifications/mark-all-read
// Clears the whole unread badge in a single UPDATE.
router.patch("/mark-all-read", async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true, read_at = now() WHERE recipient = $1 AND is_read = false`,
      [req.user._id]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
});

module.exports = router;
