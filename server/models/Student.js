const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: String,
  path: String,
  uploadedAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rollNo: { type: String, required: true, unique: true },
  department: {
    type: String,
    required: true,
    enum: ["Computer Science", "Mechanical Engineering", "Civil Engineering",
           "Electrical Engineering", "Electronics", "Information Technology"]
  },
  semester: { type: Number, required: true, min: 1, max: 8 },
  admissionYear: { type: Number, required: true },
  guardianName: { type: String, trim: true },
  guardianPhone: { type: String, trim: true },
  address: { type: String, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  category: { type: String, enum: ["General", "OBC", "SC", "ST", "EWS"] },
  documents: [documentSchema],
  status: { type: String, enum: ["active", "inactive", "graduated", "dropped"], default: "active" }
}, { timestamps: true });

// Virtual for full student info with user
studentSchema.virtual("user", { ref: "User", localField: "userId", foreignField: "_id", justOne: true });

module.exports = mongoose.model("Student", studentSchema);
