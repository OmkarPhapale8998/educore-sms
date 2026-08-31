const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  theory_marks: { type: Number, required: true, default: 0 },
  internal_marks: { type: Number, required: true, default: 0 },
  practical_marks: { type: Number, required: true, default: 0 },
  total_obtained: { type: Number, required: true, default: 0 },
  total_maximum: { type: Number, required: true },
  percentage: { type: Number, required: true, default: 0 },
  grade: { type: String, required: true, default: 'F' },
  grade_points: { type: Number, required: true, default: 0 },
  is_absent: { type: Boolean, required: true, default: false },
  entered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Unique marks per student per exam
markSchema.index({ student_id: 1, exam_id: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
