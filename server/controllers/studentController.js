const Student = require("../models/Student");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const shapeStudent = (studentDoc) => {
  if (!studentDoc) return null;
  const doc = studentDoc.toObject ? studentDoc.toObject() : studentDoc;
  return {
    _id: doc._id,
    userId: doc.user_id ? {
      _id: doc.user_id._id,
      name: doc.user_id.name,
      email: doc.user_id.email,
      phone: doc.user_id.phone,
      photo: doc.user_id.photo
    } : null,
    rollNo: doc.roll_no,
    department: doc.department,
    semester: doc.semester,
    admissionYear: doc.admission_year,
    guardianName: doc.guardian_name,
    guardianPhone: doc.guardian_phone,
    address: doc.address,
    dateOfBirth: doc.date_of_birth,
    gender: doc.gender,
    category: doc.category,
    status: doc.status,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    documents: doc.documents || []
  };
};

exports.getStudents = async (req, res, next) => {
  try {
    const { department, semester, search, status, page = 1, limit = 20, admissionYear } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (admissionYear) query.admission_year = parseInt(admissionYear);

    if (search) {
      const usersMatch = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select('_id');
      
      const userIds = usersMatch.map(u => u._id);
      
      query.$or = [
        { roll_no: { $regex: search, $options: "i" } },
        { user_id: { $in: userIds } }
      ];
    }

    const total = await Student.countDocuments(query);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.find(query)
      .populate("user_id", "name email phone photo")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: students.map(s => shapeStudent(s)),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) { next(err); }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate("user_id", "name email phone photo");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    if (req.user.role === "student") {
      if (student.user_id._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, data: shapeStudent(student) });
  } catch (err) { next(err); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const {
      name, email, phone, password,
      rollNo, department, semester, admissionYear,
      guardianName, guardianPhone, address, dateOfBirth, gender, category
    } = req.body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const hashed = await bcrypt.hash(password || "Student@123", 12);

    const user = await User.create({
      name: (name || "").trim(),
      email: cleanEmail,
      password: hashed,
      role: 'student',
      phone: phone || ""
    });

    const student = await Student.create({
      user_id: user._id,
      roll_no: rollNo,
      department,
      semester: parseInt(semester),
      admission_year: parseInt(admissionYear),
      guardian_name: guardianName || "",
      guardian_phone: guardianPhone || "",
      address: address || "",
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      category: category || null
    });

    const populatedStudent = await Student.findById(student._id).populate("user_id", "name email phone photo");

    res.status(201).json({ success: true, message: "Student created successfully", data: shapeStudent(populatedStudent) });
  } catch (err) { next(err); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, rollNo, department, semester,
            guardianName, guardianPhone, address, status } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    if (name || email || phone !== undefined) {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      
      await User.findByIdAndUpdate(student.user_id, updateData);
    }

    if (rollNo) student.roll_no = rollNo;
    if (department) student.department = department;
    if (semester) student.semester = parseInt(semester);
    if (guardianName !== undefined) student.guardian_name = guardianName;
    if (guardianPhone !== undefined) student.guardian_phone = guardianPhone;
    if (address !== undefined) student.address = address;
    if (status) student.status = status;

    await student.save();

    const updatedStudent = await Student.findById(req.params.id).populate("user_id", "name email phone photo");

    res.json({ success: true, message: "Student updated", data: shapeStudent(updatedStudent) });
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    await User.findByIdAndDelete(student.user_id);
    await Student.findByIdAndDelete(student._id);

    res.json({ success: true, message: "Student deleted" });
  } catch (err) { next(err); }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const student = await Student.findById(req.params.id).populate("user_id", "name email phone photo");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    student.documents.push({
      name: req.body.name || req.file.originalname,
      path: req.file.path.replace(/\\/g, "/")
    });

    await student.save();

    res.json({ success: true, message: "Document uploaded", data: shapeStudent(student) });
  } catch (err) { next(err); }
};

exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const summary = await Attendance.aggregate([
      { $match: { student_id: new mongoose.Types.ObjectId(req.params.id) } },
      { 
        $group: {
          _id: "$course_id",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
        }
      },
      { 
        $lookup: { 
          from: 'courses', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'course' 
        } 
      },
      { $unwind: "$course" },
      { 
        $project: {
          _id: 0,
          courseCode: "$course.code",
          courseName: "$course.name",
          total: 1,
          present: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 2] }
        }
      }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};
