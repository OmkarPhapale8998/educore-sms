const Student = require("../models/Student");
const User = require("../models/User");
const Fee = require("../models/Fee");
const Attendance = require("../models/Attendance");

// @desc   Get all students with filters, search, pagination
// @route  GET /api/students
// @access Admin, Faculty
exports.getStudents = async (req, res, next) => {
  try {
    const { department, semester, search, status, page = 1, limit = 20, admissionYear } = req.query;
    const query = {};

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (admissionYear) query.admissionYear = parseInt(admissionYear);

    let studentIds = null;
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      const userIdList = users.map(u => u._id);
      query.$or = [
        { userId: { $in: userIdList } },
        { rollNo: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate("userId", "name email phone photo")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) { next(err); }
};

// @desc   Get single student
// @route  GET /api/students/:id
// @access Admin, Faculty, Student (own)
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("userId", "name email phone photo");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Students can only view their own profile
    if (req.user.role === "student") {
      const myStudent = await Student.findOne({ userId: req.user._id });
      if (!myStudent || myStudent._id.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

// @desc   Create student (also creates User account)
// @route  POST /api/students
// @access Admin only
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name, email, phone, password,
      rollNo, department, semester, admissionYear,
      guardianName, guardianPhone, address, dateOfBirth, gender, category
    } = req.body;

    // Create User account
    const user = await User.create({
      name, email, phone,
      password: password || "Student@123",
      role: "student"
    });

    // Create Student profile
    const student = await Student.create({
      userId: user._id,
      rollNo, department, semester: parseInt(semester),
      admissionYear: parseInt(admissionYear),
      guardianName, guardianPhone, address, dateOfBirth, gender, category
    });

    const populated = await Student.findById(student._id).populate("userId", "name email phone photo");
    res.status(201).json({ success: true, message: "Student created successfully", data: populated });
  } catch (err) { next(err); }
};

// @desc   Update student
// @route  PUT /api/students/:id
// @access Admin only
exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, rollNo, department, semester,
            guardianName, guardianPhone, address, status } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Update user info
    if (name || email || phone) {
      await User.findByIdAndUpdate(student.userId, { name, email, phone });
    }

    // Update student info
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { rollNo, department, semester, guardianName, guardianPhone, address, status },
      { new: true, runValidators: true }
    ).populate("userId", "name email phone photo");

    res.json({ success: true, message: "Student updated", data: updatedStudent });
  } catch (err) { next(err); }
};

// @desc   Delete student
// @route  DELETE /api/students/:id
// @access Admin only
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Student deleted" });
  } catch (err) { next(err); }
};

// @desc   Upload student document
// @route  POST /api/students/:id/documents
// @access Admin only
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $push: { documents: { name: req.body.name || req.file.originalname, path: req.file.path.replace(/\\/g, "/") } } },
      { new: true }
    );

    res.json({ success: true, message: "Document uploaded", data: student });
  } catch (err) { next(err); }
};

// @desc   Get student attendance summary
// @route  GET /api/students/:id/attendance-summary
// @access Admin, Faculty, Student (own)
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const summary = await Attendance.aggregate([
      { $match: { student: require("mongoose").Types.ObjectId(req.params.id) } },
      { $group: {
        _id: "$course",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
      }},
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $project: {
        courseCode: "$course.code",
        courseName: "$course.name",
        total: 1,
        present: 1,
        percentage: { $multiply: [{ $divide: ["$present", "$total"] }, 100] }
      }}
    ]);

    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};
