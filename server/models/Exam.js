const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Mid-Term", "Final", "Practical", "Internal", "Quiz"], required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
  instructions: String
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);
