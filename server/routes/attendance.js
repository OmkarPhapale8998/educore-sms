const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const User = require("../models/User");

router.use(protect);

// POST /api/attendance/mark — bulk mark attendance
router.post("/mark", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { courseId, date, records, department, semester, markedBy } = req.body;
    const facultyId = markedBy || req.user._id;

    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, course: courseId, date: new Date(date) },
        update: { $set: { status: r.status, markedBy: facultyId, department, semester } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);

    // Check low attendance for each student and create notifications
    for (const r of records) {
      const stats = await Attendance.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(r.studentId), course: new mongoose.Types.ObjectId(courseId) } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
        }}
      ]);
      if (stats.length > 0) {
        const pct = (stats[0].present / stats[0].total) * 100;
        if (pct < 75 && stats[0].total >= 5) {
          const student = await Student.findById(r.studentId);
          if (student) {
            await Notification.findOneAndUpdate(
              { recipient: student.userId, type: "low_attendance", relatedId: courseId },
              {
                $set: {
                  title: "Low Attendance Alert",
                  message: `Your attendance has dropped to ${pct.toFixed(1)}% in this subject. Minimum 75% required.`,
                  isRead: false
                }
              },
              { upsert: true }
            );
          }
        }
      }
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (err) { next(err); }
});

// GET /api/attendance — with filters
router.get("/", async (req, res, next) => {
  try {
    const { studentId, courseId, month, year, date } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (courseId) query.course = courseId;
    if (date) query.date = new Date(date);
    else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    }
    const attendance = await Attendance.find(query)
      .populate({ path: "student", populate: { path: "userId", select: "name" } })
      .populate("course", "name code")
      .sort({ date: -1 });
    res.json({ success: true, data: attendance });
  } catch (err) { next(err); }
});

// GET /api/attendance/percentage/:studentId — per-subject breakdown
router.get("/percentage/:studentId", async (req, res, next) => {
  try {
    const summary = await Attendance.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(req.params.studentId) } },
      { $group: {
        _id: "$course",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } }
      }},
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $project: {
        courseCode: "$course.code",
        courseName: "$course.name",
        total: 1, present: 1, absent: 1, leave: 1,
        percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }
      }}
    ]);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// GET /api/attendance/today — today's summary for dashboard
router.get("/today", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, present] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: "present" })
    ]);

    res.json({ success: true, data: { total, present, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0 } });
  } catch (err) { next(err); }
});

module.exports = router;
