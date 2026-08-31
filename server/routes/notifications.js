const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Notification = require("../models/Notification");

router.use(protect);

router.get("/me", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);
      
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      is_read: false 
    });

    const data = notifications.map(n => {
      const obj = n.toObject();
      return {
        _id: obj._id,
        title: obj.title,
        message: obj.message,
        type: obj.type,
        isRead: obj.is_read,
        createdAt: obj.created_at
      };
    });

    res.json({ success: true, data, unreadCount });
  } catch (err) { next(err); }
});

// IMPORTANT: /mark-all-read MUST come BEFORE /:id/read
// otherwise Express matches "mark-all-read" as the :id parameter
router.patch("/mark-all-read", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, is_read: false },
      { $set: { is_read: true, read_at: new Date() } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { is_read: true, read_at: new Date() } }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { next(err); }
});

module.exports = router;
