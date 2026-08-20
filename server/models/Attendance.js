const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "leave"], required: true },
  department: String,
  semester: Number,
  remarks: String
}, { timestamps: true });

// Compound index to prevent duplicate attendance for same student/course/date
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
