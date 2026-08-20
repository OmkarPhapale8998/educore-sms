const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: { type: String, required: true, unique: true },
  department: {
    type: String,
    required: true,
    enum: ["Computer Science", "Mechanical Engineering", "Civil Engineering",
           "Electrical Engineering", "Electronics", "Information Technology"]
  },
  designation: { type: String, default: "Assistant Professor" },
  qualification: [String],
  subjectsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  joiningDate: { type: Date, default: Date.now },
  experience: Number,
  status: { type: String, enum: ["active", "inactive", "on_leave"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Faculty", facultySchema);
