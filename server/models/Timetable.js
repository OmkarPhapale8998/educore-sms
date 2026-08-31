const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  room: String,
  type: { type: String, required: true, default: 'lecture', enum: ['lecture', 'lab', 'tutorial', 'break'] }
});

const timetableSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  academic_year: { type: String, required: true },
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  is_active: { type: Boolean, required: true, default: true },
  slots: [timetableSlotSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

timetableSchema.index({ department: 1, semester: 1, academic_year: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
