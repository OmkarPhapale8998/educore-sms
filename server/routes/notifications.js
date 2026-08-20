const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Notification = require("../models/Notification");

router.use(protect);

// GET my notifications
router.get("/me", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH mark as read
router.patch("/:id/read", async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { next(err); }
});

// PATCH mark all as read
router.patch("/mark-all-read", async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
});

module.exports = router;
