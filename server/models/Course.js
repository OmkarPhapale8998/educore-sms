const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  materials: [{ name: String, path: String }]
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  department: {
    type: String,
    required: true,
    enum: ["Computer Science", "Mechanical Engineering", "Civil Engineering",
           "Electrical Engineering", "Electronics", "Information Technology"]
  },
  semester: { type: Number, required: true, min: 1, max: 8 },
  credits: { type: Number, required: true },
  type: { type: String, enum: ["Theory", "Practical", "Both"], default: "Theory" },
  assignedFaculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  syllabusUnits: [unitSchema],
  syllabusFile: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
