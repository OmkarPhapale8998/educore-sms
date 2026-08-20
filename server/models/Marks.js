const mongoose = require("mongoose");

const GRADE_THRESHOLDS = [
  { min: 90, grade: "O", points: 10 },
  { min: 80, grade: "A+", points: 9 },
  { min: 70, grade: "A", points: 8 },
  { min: 60, grade: "B+", points: 7 },
  { min: 50, grade: "B", points: 6 },
  { min: 40, grade: "C", points: 5 },
  { min: 0, grade: "F", points: 0 }
];

const calculateGrade = (obtained, total) => {
  const pct = (obtained / total) * 100;
  const gradeObj = GRADE_THRESHOLDS.find(g => pct >= g.min);
  return { percentage: parseFloat(pct.toFixed(2)), grade: gradeObj.grade, gradePoints: gradeObj.points };
};

const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  theoryMarks: { type: Number, default: 0 },
  internalMarks: { type: Number, default: 0 },
  practicalMarks: { type: Number, default: 0 },
  totalObtained: { type: Number, default: 0 },
  totalMaximum: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  grade: { type: String, default: "F" },
  gradePoints: { type: Number, default: 0 },
  isAbsent: { type: Boolean, default: false },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

marksSchema.index({ student: 1, exam: 1 }, { unique: true });

// Auto-calculate before save
marksSchema.pre("save", function (next) {
  this.totalObtained = (this.theoryMarks || 0) + (this.internalMarks || 0) + (this.practicalMarks || 0);
  const result = calculateGrade(this.totalObtained, this.totalMaximum);
  this.percentage = result.percentage;
  this.grade = result.grade;
  this.gradePoints = result.gradePoints;
  next();
});

module.exports = mongoose.model("Marks", marksSchema);
