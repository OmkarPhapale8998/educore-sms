const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Course = require("../models/Course");

router.use(protect);

const shapeCourse = (courseDoc, detail = false) => {
  if (!courseDoc) return null;
  const doc = courseDoc.toObject ? courseDoc.toObject() : courseDoc;
  return {
    _id: doc._id,
    code: doc.code,
    name: doc.name,
    type: doc.type,
    department: doc.department,
    semester: doc.semester,
    credits: doc.credits,
    assignedFaculty: doc.assigned_faculty_id ? {
      _id: doc.assigned_faculty_id._id,
      designation: doc.assigned_faculty_id.designation,
      userId: detail && doc.assigned_faculty_id.user_id ? {
        name: doc.assigned_faculty_id.user_id.name,
        email: doc.assigned_faculty_id.user_id.email
      } : (doc.assigned_faculty_id.user_id ? { name: doc.assigned_faculty_id.user_id.name } : null)
    } : null,
    syllabusUnits: doc.syllabus_units || [],
    syllabusFile: doc.syllabus_file,
    isActive: doc.is_active
  };
};

router.get("/", async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .populate({
        path: 'assigned_faculty_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: courses.map(c => shapeCourse(c)) });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'assigned_faculty_id',
        populate: { path: 'user_id', select: 'name email' }
      });
      
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    res.json({ success: true, data: shapeCourse(course, true) });
  } catch (err) { next(err); }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { name, code, department, semester, credits, type, assignedFaculty } = req.body;

    const exists = await Course.findOne({ code });
    if (exists) return res.status(400).json({ success: false, message: "Course code already exists" });

    const course = await Course.create({
      name,
      code,
      department,
      semester: parseInt(semester),
      credits: parseInt(credits),
      type,
      assigned_faculty_id: assignedFaculty || undefined
    });

    const populatedCourse = await Course.findById(course._id)
      .populate({
        path: 'assigned_faculty_id',
        populate: { path: 'user_id', select: 'name email' }
      });

    res.status(201).json({ success: true, message: "Course created", data: shapeCourse(populatedCourse) });
  } catch (err) { next(err); }
});

router.put("/:id", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { name, code, department, type, assignedFaculty, isActive, semester, credits } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (code && code !== course.code) {
      const exists = await Course.findOne({ code });
      if (exists) return res.status(400).json({ success: false, message: "Course code already exists" });
    }

    if (name) course.name = name;
    if (code) course.code = code;
    if (department) course.department = department;
    if (type) course.type = type;
    if (assignedFaculty !== undefined) course.assigned_faculty_id = assignedFaculty || undefined;
    if (isActive !== undefined) course.is_active = isActive;
    if (semester) course.semester = parseInt(semester);
    if (credits) course.credits = parseInt(credits);

    await course.save();

    const populatedCourse = await Course.findById(req.params.id)
      .populate({
        path: 'assigned_faculty_id',
        populate: { path: 'user_id', select: 'name email' }
      });

    res.json({ success: true, data: shapeCourse(populatedCourse) });
  } catch (err) { next(err); }
});

router.patch("/:id/syllabus-unit/:unitId", authorize("admin", "faculty"), async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;
    const updateData = {};
    if (title !== undefined) updateData["syllabus_units.$.title"] = title;
    if (description !== undefined) updateData["syllabus_units.$.description"] = description;
    if (completed !== undefined) updateData["syllabus_units.$.completed"] = completed;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, "syllabus_units._id": req.params.unitId },
      { $set: updateData },
      { new: true }
    ).populate({
      path: 'assigned_faculty_id',
      populate: { path: 'user_id', select: 'name email' }
    });

    if (!course) return res.status(404).json({ success: false, message: "Course or Unit not found" });

    res.json({ success: true, data: shapeCourse(course) });
  } catch (err) { next(err); }
});

router.post("/:id/syllabus", authorize("admin", "faculty"), upload.single("syllabus"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { syllabus_file: req.file.path.replace(/\\/g, "/") },
      { new: true }
    ).populate({
      path: 'assigned_faculty_id',
      populate: { path: 'user_id', select: 'name email' }
    });

    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    res.json({ success: true, data: shapeCourse(course) });
  } catch (err) { next(err); }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
