const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const User = require("../models/User");

router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const { category, targetAudience, search, pinned, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (targetAudience) query.targetAudience = { $in: [targetAudience, "all"] };
    if (pinned === "true") query.isPinned = true;
    if (search) query.title = { $regex: search, $options: "i" };
    query.expiresAt = { $gte: new Date() };

    const total = await Notice.countDocuments(query);
    const notices = await Notice.find(query)
      .populate("postedBy", "name role")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, data: notices, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate("postedBy", "name role");
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin", "faculty"), upload.single("attachment"), async (req, res, next) => {
  try {
    const noticeData = { ...req.body, postedBy: req.user._id };
    if (req.file) noticeData.attachment = { name: req.file.originalname, path: req.file.path.replace(/\\/g, "/") };
    if (!noticeData.expiresAt) noticeData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const notice = await Notice.create(noticeData);

    // Notify target audience
    let userFilter = {};
    if (req.body.targetAudience === "students") userFilter.role = "student";
    else if (req.body.targetAudience === "faculty") userFilter.role = "faculty";

    const recipients = await User.find(userFilter).select("_id");
    const notifications = recipients.map(u => ({
      recipient: u._id,
      type: "new_notice",
      title: "New Notice Posted",
      message: notice.title,
      relatedId: notice._id,
      relatedModel: "Notice"
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: "Notice posted", data: notice });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
});

router.patch("/:id/pin", authorize("admin"), async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    notice.isPinned = !notice.isPinned;
    await notice.save();
    res.json({ success: true, data: notice, message: notice.isPinned ? "Notice pinned" : "Notice unpinned" });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
