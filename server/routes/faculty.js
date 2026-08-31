const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const Faculty = require("../models/Faculty");
const User = require("../models/User");

router.use(protect);

const shapeFaculty = (facultyDoc) => {
  if (!facultyDoc) return null;
  const doc = facultyDoc.toObject ? facultyDoc.toObject() : facultyDoc;
  return {
    _id: doc._id,
    userId: doc.user_id ? {
      _id: doc.user_id._id,
      name: doc.user_id.name,
      email: doc.user_id.email,
      phone: doc.user_id.phone,
      photo: doc.user_id.photo
    } : null,
    employeeId: doc.employee_id,
    department: doc.department,
    designation: doc.designation,
    qualification: doc.qualification || [],
    subjectsAssigned: doc.courses ? doc.courses.map(c => ({
      _id: c._id,
      code: c.code,
      name: c.name,
      department: c.department,
      semester: c.semester
    })) : [],
    status: doc.status,
    createdAt: doc.created_at
  };
};

router.get("/", authorize("admin", "faculty", "student"), async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;

    if (search) {
      const usersMatch = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select('_id');
      
      const userIds = usersMatch.map(u => u._id);
      
      query.$or = [
        { employee_id: { $regex: search, $options: "i" } },
        { user_id: { $in: userIds } }
      ];
    }

    let facultyQuery = Faculty.find(query)
      .populate('user_id', 'name email phone photo')
      .populate('courses')
      .sort({ created_at: -1 });

    if (limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      facultyQuery = facultyQuery.skip(skip).limit(parseInt(limit));
    }

    const faculties = await facultyQuery;
    res.json({ success: true, data: faculties.map(f => shapeFaculty(f)) });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user_id', 'name email phone photo')
      .populate('courses');
      
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

    res.json({ success: true, data: shapeFaculty(faculty) });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, password, employeeId, department, designation, qualification, joiningDate } = req.body;

    const hashed = await bcrypt.hash(password || "Faculty@1234", 12);

    const user = await User.create({
      name: (name || "").trim(),
      email: (email || "").trim().toLowerCase(),
      password: hashed,
      role: 'faculty',
      phone: phone || ""
    });

    const faculty = await Faculty.create({
      user_id: user._id,
      employee_id: employeeId,
      department: department || undefined,
      designation: designation || undefined,
      qualification: Array.isArray(qualification) ? qualification : [],
      joining_date: joiningDate || undefined
    });

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('user_id', 'name email phone photo')
      .populate('courses');

    res.status(201).json({ success: true, message: "Faculty created", data: shapeFaculty(populatedFaculty) });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const { name, email, phone, department, designation, qualification, status, subjectsAssigned } = req.body;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

    if (name || email || phone) {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      
      await User.findByIdAndUpdate(faculty.user_id, updateData);
    }

    if (department !== undefined) faculty.department = department;
    if (designation !== undefined) faculty.designation = designation;
    if (Array.isArray(qualification)) faculty.qualification = qualification;
    if (status !== undefined) faculty.status = status;
    
    if (Array.isArray(subjectsAssigned)) {
      faculty.courses = subjectsAssigned;
    }

    await faculty.save();

    const populatedFaculty = await Faculty.findById(req.params.id)
      .populate('user_id', 'name email phone photo')
      .populate('courses');

    res.json({ success: true, data: shapeFaculty(populatedFaculty) });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

    await User.findByIdAndDelete(faculty.user_id);
    await Faculty.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Faculty deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
