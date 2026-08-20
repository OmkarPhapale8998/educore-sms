const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/auth");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Marks = require("../models/Marks");
const { generateExcelReport } = require("../utils/excelGenerator");

router.use(protect, authorize("admin", "faculty"));

// GET enrollment trend (students per admission year)
router.get("/enrollment-trend", async (req, res, next) => {
  try {
    const data = await Student.aggregate([
      { $group: { _id: "$admissionYear", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { year: "$_id", count: 1, _id: 0 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET department distribution
router.get("/department-distribution", async (req, res, next) => {
  try {
    const data = await Student.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { department: "$_id", count: 1, _id: 0 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET attendance trend (last N weeks)
router.get("/attendance-trend", async (req, res, next) => {
  try {
    const weeks = parseInt(req.query.weeks) || 10;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const data = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      { $group: {
        _id: { $week: "$date" },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } },
      { $project: {
        week: "$_id",
        percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] },
        _id: 0
      }}
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET fee collection trend (monthly)
router.get("/fee-collection-trend", async (req, res, next) => {
  try {
    const data = await Fee.aggregate([
      { $unwind: "$paymentHistory" },
      { $group: {
        _id: { month: { $month: "$paymentHistory.date" }, year: { $year: "$paymentHistory.date" } },
        collected: { $sum: "$paymentHistory.amount" }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: {
        month: "$_id.month", year: "$_id.year",
        collected: 1, _id: 0
      }}
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET pass rate for an exam
router.get("/pass-rate", async (req, res, next) => {
  try {
    const { examId } = req.query;
    const match = examId ? { exam: new mongoose.Types.ObjectId(examId) } : {};
    const data = await Marks.aggregate([
      { $match: match },
      { $lookup: { from: "exams", localField: "exam", foreignField: "_id", as: "exam" } },
      { $unwind: "$exam" },
      { $group: {
        _id: "$exam.name",
        total: { $sum: 1 },
        passed: { $sum: { $cond: [{ $ne: ["$grade", "F"] }, 1, 0] } }
      }},
      { $project: {
        examName: "$_id",
        total: 1, passed: 1,
        passRate: { $round: [{ $multiply: [{ $divide: ["$passed", "$total"] }, 100] }, 1] },
        _id: 0
      }}
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET dashboard summary stats
router.get("/dashboard-summary", async (req, res, next) => {
  try {
    const [totalStudents, totalFaculty, feeStats, todayAttendance] = await Promise.all([
      Student.countDocuments({ status: "active" }),
      require("../models/Faculty").countDocuments({ status: "active" }),
      Fee.aggregate([{ $group: { _id: null, totalDue: { $sum: "$totalAmount" }, collected: { $sum: "$paidAmount" } } }]),
      Attendance.aggregate([
        { $match: { date: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } } } }
      ])
    ]);

    const fee = feeStats[0] || { totalDue: 0, collected: 0 };
    const att = todayAttendance[0] || { total: 0, present: 0 };

    res.json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalRevenue: fee.collected,
        pendingFees: fee.totalDue - fee.collected,
        todayAttendancePercent: att.total > 0 ? parseFloat(((att.present / att.total) * 100).toFixed(1)) : 0
      }
    });
  } catch (err) { next(err); }
});

// GET Excel export of students
router.get("/export/students", async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const students = await Student.find(query).populate("userId", "name email phone");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=students-report.xlsx");
    await generateExcelReport(students, res);
  } catch (err) { next(err); }
});

module.exports = router;
