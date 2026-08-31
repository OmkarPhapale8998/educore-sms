const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Exam = require("../models/Exam");

router.use(protect);

const shapeExam = (examDoc, detail = false) => {
  if (!examDoc) return null;
  const doc = examDoc.toObject ? examDoc.toObject() : examDoc;
  return {
    _id: doc._id,
    name: doc.name,
    type: doc.type,
    status: doc.status,
    department: doc.department,
    semester: doc.semester,
    date: doc.date,
    startTime: doc.start_time,
    endTime: doc.end_time,
    room: doc.room,
    totalMarks: doc.total_marks,
    passingMarks: doc.passing_marks,
    instructions: doc.instructions,
    course: doc.course_id ? {
      _id: doc.course_id._id,
      code: doc.course_id.code,
      name: doc.course_id.name,
      ...(detail ? { credits: doc.course_id.credits } : {})
    } : null
  };
};

router.get("/", async (req, res, next) => {
  try {
    const { department, semester, type, status, limit } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (type) query.type = type;
    if (status) query.status = status;

    let examQuery = Exam.find(query).populate('course_id').sort({ date: -1 });
    if (limit) {
      examQuery = examQuery.limit(parseInt(limit));
    }

    const exams = await examQuery;
    res.json({ success: true, data: exams.map(e => shapeExam(e)) });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('course_id');
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    res.json({ success: true, data: shapeExam(exam, true) });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, type, course, department, semester, date, startTime, endTime, room, totalMarks, passingMarks, instructions } = req.body;

    const exam = await Exam.create({
      name,
      type,
      course_id: course,
      department,
      semester: parseInt(semester),
      date,
      start_time: startTime,
      end_time: endTime,
      room,
      total_marks: parseInt(totalMarks),
      passing_marks: parseInt(passingMarks),
      instructions
    });

    const populatedExam = await Exam.findById(exam._id).populate('course_id');

    res.status(201).json({ success: true, message: "Exam scheduled", data: shapeExam(populatedExam) });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const { name, type, course, department, date, startTime, endTime, room, status, instructions, semester, totalMarks, passingMarks } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (course !== undefined) updateData.course_id = course;
    if (department !== undefined) updateData.department = department;
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (room !== undefined) updateData.room = room;
    if (status !== undefined) updateData.status = status;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (semester !== undefined) updateData.semester = parseInt(semester);
    if (totalMarks !== undefined) updateData.total_marks = parseInt(totalMarks);
    if (passingMarks !== undefined) updateData.passing_marks = parseInt(passingMarks);

    const exam = await Exam.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true }).populate('course_id');
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    res.json({ success: true, data: shapeExam(exam) });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Exam deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
