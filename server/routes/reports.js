const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const { generateExcelReport } = require("../utils/excelGenerator");

router.use(protect, authorize("admin", "faculty"));

router.get("/enrollment-trend", async (req, res, next) => {
  try {
    const rows = await Student.aggregate([
      { $group: { _id: "$admission_year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { year: "$_id", count: 1, _id: 0 } }
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/department-distribution", async (req, res, next) => {
  try {
    const rows = await Student.aggregate([
      { $match: { status: 'active', department: { $ne: null, $ne: "" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { department: "$_id", count: 1, _id: 0 } }
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/pass-rate", async (req, res, next) => {
  try {
    const { examId } = req.query;
    const matchStage = {};
    if (examId) {
      matchStage.exam_id = new mongoose.Types.ObjectId(examId);
    }

    const rows = await Mark.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'exams', localField: 'exam_id', foreignField: '_id', as: 'exam' } },
      { $unwind: "$exam" },
      {
        $group: {
          _id: "$exam.name",
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $ne: ["$grade", "F"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          examName: "$_id",
          total: 1,
          passed: 1,
          passRate: { $round: [{ $multiply: [{ $divide: ["$passed", "$total"] }, 100] }, 1] },
          _id: 0
        }
      }
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/dashboard-summary", async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23,59,59,999);

    const [totalStudents, totalFaculty, attRes] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Faculty.countDocuments({ status: 'active' }),
      Attendance.aggregate([
        { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
        {
          $group: {
            _id: null,
            present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
            counted: { $sum: { $cond: [{ $in: ["$status", ["present", "absent"]] }, 1, 0] } }
          }
        }
      ])
    ]);

    const att = attRes.length > 0 ? attRes[0] : { present: 0, counted: 0 };

    res.json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        todayAttendancePercent: att.counted > 0 ? parseFloat(((att.present / att.counted) * 100).toFixed(1)) : 0
      }
    });
  } catch (err) { next(err); }
});

router.get("/export/students", async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const studentsDocs = await Student.find(query)
      .populate('user_id', 'name email phone')
      .sort({ created_at: -1 });

    const students = studentsDocs.map(s => {
      const obj = s.toObject();
      return {
        _id: obj._id,
        rollNo: obj.roll_no,
        userId: obj.user_id ? {
          _id: obj.user_id._id,
          name: obj.user_id.name,
          email: obj.user_id.email,
          phone: obj.user_id.phone
        } : null,
        department: obj.department,
        semester: obj.semester,
        admissionYear: obj.admission_year,
        status: obj.status
      };
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=students-report.xlsx");
    await generateExcelReport(students, res);
  } catch (err) { next(err); }
});

module.exports = router;
