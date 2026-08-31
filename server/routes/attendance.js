const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

router.use(protect);

router.post("/mark", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { courseId, date, records, department, semester } = req.body;

    let facultyId = null;
    if (req.user.role === "faculty") {
      const fac = await Faculty.findOne({ user_id: req.user._id });
      if (fac) facultyId = fac._id;
    }

    const dateObj = new Date(date);
    dateObj.setUTCHours(0,0,0,0);

    for (const r of records) {
      const updateData = {
        status: r.status,
        department: department || undefined,
        semester: semester != null ? parseInt(semester) : undefined,
      };
      if (facultyId) updateData.marked_by = facultyId;
      if (r.remarks !== undefined) updateData.remarks = r.remarks;

      await Attendance.findOneAndUpdate(
        { student_id: r.studentId, course_id: courseId, date: dateObj },
        { $set: updateData },
        { upsert: true, new: true }
      );
    }

    for (const r of records) {
      const summary = await Attendance.aggregate([
        { $match: { student_id: new mongoose.Types.ObjectId(r.studentId), course_id: new mongoose.Types.ObjectId(courseId) } },
        { 
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
          }
        }
      ]);

      if (summary.length === 0 || summary[0].total === 0) continue;
      const { total, present } = summary[0];
      const pct = (present / total) * 100;

      if (pct < 75 && total >= 5) {
        const stu = await Student.findById(r.studentId);
        if (stu) {
          const recipient = stu.user_id;
          const title = "Low Attendance Alert";
          const message = `Your attendance has dropped to ${pct.toFixed(1)}% in this subject. Minimum 75% required.`;
          
          await Notification.findOneAndUpdate(
            { recipient, type: 'low_attendance', related_id: courseId },
            { $set: { title, message, is_read: false } },
            { upsert: true }
          );
        }
      }
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { studentId, courseId, month, year, date } = req.query;
    
    const query = {};
    if (studentId) query.student_id = studentId;
    if (courseId) query.course_id = courseId;

    if (date) {
      const d = new Date(date);
      d.setUTCHours(0,0,0,0);
      query.date = d;
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      query.date = { $gte: start, $lte: end };
    }

    const attendances = await Attendance.find(query)
      .populate({
        path: 'student_id',
        select: 'roll_no user_id',
        populate: { path: 'user_id', select: 'name' }
      })
      .populate('course_id', 'code name')
      .sort({ date: -1 });

    const data = attendances.map(a => {
      const obj = a.toObject();
      return {
        _id: obj._id,
        status: obj.status,
        date: obj.date,
        remarks: obj.remarks,
        semester: obj.semester,
        department: obj.department,
        student: obj.student_id ? {
          _id: obj.student_id._id,
          rollNo: obj.student_id.roll_no,
          userId: { name: obj.student_id.user_id ? obj.student_id.user_id.name : "" }
        } : null,
        course: obj.course_id ? {
          _id: obj.course_id._id,
          code: obj.course_id.code,
          name: obj.course_id.name
        } : null
      };
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/percentage/:studentId", async (req, res, next) => {
  try {
    const rows = await Attendance.aggregate([
      { $match: { student_id: new mongoose.Types.ObjectId(req.params.studentId) } },
      {
        $group: {
          _id: "$course_id",
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          total: { $sum: 1 },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: "$course" },
      {
        $project: {
          _id: 0,
          courseCode: "$course.code",
          courseName: "$course.name",
          present: 1,
          total: 1,
          absent: 1,
          leave: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }
        }
      }
    ]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/today", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23,59,59,999);

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
        }
      }
    ]);

    const total = summary.length > 0 ? summary[0].total : 0;
    const present = summary.length > 0 ? summary[0].present : 0;
    
    res.json({ 
      success: true, 
      data: { 
        total, 
        present, 
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0 
      } 
    });
  } catch (err) { next(err); }
});

module.exports = router;
