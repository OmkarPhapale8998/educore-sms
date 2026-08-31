const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['Mid-Term', 'Final', 'Practical', 'Internal', 'Quiz'] },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: { type: String, required: true },
  total_marks: { type: Number, required: true },
  passing_marks: { type: Number, required: true },
  status: { type: String, required: true, default: 'scheduled', enum: ['scheduled', 'ongoing', 'completed', 'cancelled'] },
  instructions: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Exam', examSchema);
