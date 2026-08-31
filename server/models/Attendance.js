const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  marked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'leave'] },
  department: String,
  semester: Number,
  remarks: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Ensure unique attendance per student per course per date
attendanceSchema.index({ student_id: 1, course_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ student_id: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
