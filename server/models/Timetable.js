const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  room: String,
  type: { type: String, enum: ["lecture", "lab", "tutorial", "break"], default: "lecture" }
});

const timetableSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true
  },
  slots: [slotSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

timetableSchema.index({ department: 1, semester: 1, day: 1 });

module.exports = mongoose.model("Timetable", timetableSchema);
