const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, default: 'General', enum: ['General', 'Exam', 'Event', 'Holiday', 'Academic', 'Urgent'] },
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target_audience: { type: String, required: true, default: 'all', enum: ['all', 'students', 'faculty', 'admin'] },
  department: { type: String, required: true, default: 'all' },
  attachment_name: String,
  attachment_path: String,
  is_pinned: { type: Boolean, required: true, default: false },
  is_published: { type: Boolean, required: true, default: true },
  expires_at: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

noticeSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
