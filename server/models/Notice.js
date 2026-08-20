const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["General", "Exam", "Event", "Holiday", "Fee", "Academic", "Urgent"],
    default: "General"
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetAudience: {
    type: String,
    enum: ["all", "students", "faculty", "admin"],
    default: "all"
  },
  department: { type: String, default: "all" },
  attachment: { name: String, path: String },
  isPinned: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  expiresAt: Date
}, { timestamps: true });

noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notice", noticeSchema);
