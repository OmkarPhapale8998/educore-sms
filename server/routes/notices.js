const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Notice = require("../models/Notice");
const User = require("../models/User");
const Notification = require("../models/Notification");

router.use(protect);

const shapeNotice = (noticeDoc) => {
  if (!noticeDoc) return null;
  const doc = noticeDoc.toObject ? noticeDoc.toObject() : noticeDoc;
  return {
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    postedBy: doc.posted_by ? { 
      _id: doc.posted_by._id, 
      name: doc.posted_by.name, 
      role: doc.posted_by.role 
    } : null,
    targetAudience: doc.target_audience,
    department: doc.department,
    attachment: doc.attachment_name && doc.attachment_path ? { name: doc.attachment_name, path: doc.attachment_path } : null,
    isPinned: doc.is_pinned,
    isPublished: doc.is_published,
    expiresAt: doc.expires_at,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  };
};

const toBool = (v) => v === true || v === "true";

router.get("/", async (req, res, next) => {
  try {
    const { category, targetAudience, search, pinned, page = 1, limit = 20 } = req.query;
    
    const query = {
      is_published: true,
      $or: [
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    };

    if (category) query.category = category;
    if (targetAudience) query.target_audience = { $in: [targetAudience, 'all'] };
    if (pinned === "true") query.is_pinned = true;
    if (search) query.title = { $regex: search, $options: "i" };

    const total = await Notice.countDocuments(query);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notices = await Notice.find(query)
      .populate('posted_by', 'name role')
      .sort({ is_pinned: -1, created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: notices.map(shapeNotice),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('posted_by', 'name role');
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: shapeNotice(notice) });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin", "faculty"), upload.single("attachment"), async (req, res, next) => {
  try {
    const { title, description, category, targetAudience, department, isPinned, isPublished, expiresAt } = req.body;
    
    const finalExpiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const notice = await Notice.create({
      title,
      description,
      category: category || "General",
      posted_by: req.user._id,
      target_audience: targetAudience || "all",
      department: department || "all",
      attachment_name: req.file ? req.file.originalname : undefined,
      attachment_path: req.file ? req.file.path.replace(/\\/g, "/") : undefined,
      is_pinned: toBool(isPinned),
      is_published: isPublished === undefined ? true : toBool(isPublished),
      expires_at: finalExpiresAt
    });

    const populatedNotice = await Notice.findById(notice._id).populate('posted_by', 'name role');

    const roleFilter = targetAudience === "students" ? "student" : targetAudience === "faculty" ? "faculty" : null;
    
    const userQuery = {};
    if (roleFilter) userQuery.role = roleFilter;
    
    const users = await User.find(userQuery).select('_id');
    
    if (users.length > 0) {
      const notifications = users.map(u => ({
        recipient: u._id,
        type: 'new_notice',
        title: "New Notice Posted",
        message: notice.title,
        related_id: notice._id,
        related_model: 'Notice'
      }));
      
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, message: "Notice posted", data: shapeNotice(populatedNotice) });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { title, description, category, targetAudience, department, isPinned, isPublished, expiresAt } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (targetAudience !== undefined) updateData.target_audience = targetAudience;
    if (department !== undefined) updateData.department = department;
    if (isPinned !== undefined) updateData.is_pinned = toBool(isPinned);
    if (isPublished !== undefined) updateData.is_published = toBool(isPublished);
    if (expiresAt !== undefined) updateData.expires_at = expiresAt ? new Date(expiresAt) : null;

    const notice = await Notice.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true }).populate('posted_by', 'name role');
    
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    
    res.json({ success: true, data: shapeNotice(notice) });
  } catch (err) { next(err); }
});

router.patch("/:id/pin", authorize("admin"), async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    notice.is_pinned = !notice.is_pinned;
    await notice.save();

    const populatedNotice = await Notice.findById(req.params.id).populate('posted_by', 'name role');

    res.json({
      success: true,
      data: shapeNotice(populatedNotice),
      message: notice.is_pinned ? "Notice pinned" : "Notice unpinned"
    });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
