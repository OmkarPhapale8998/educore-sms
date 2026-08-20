const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Course = require("../models/Course");
const Fee = require("../models/Fee");
const Notice = require("../models/Notice");
const Exam = require("../models/Exam");

const DEPARTMENTS = [
  "Computer Science", "Mechanical Engineering", "Civil Engineering",
  "Electrical Engineering", "Electronics", "Information Technology"
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Student.deleteMany({}), Faculty.deleteMany({}),
      Course.deleteMany({}), Fee.deleteMany({}), Notice.deleteMany({}), Exam.deleteMany({})
    ]);
    console.log("Cleared existing data...");

    // ─── Create Admin ───────────────────────────────────────
    const adminUser = await User.create({
      name: "Admin User", email: "admin@educore.edu",
      password: "Admin@1234", role: "admin", phone: "9000000001"
    });

    // ─── Create Courses ──────────────────────────────────────
    const courseData = [
      { name: "Data Structures & Algorithms", code: "CS301", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Database Management Systems", code: "CS302", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Operating Systems", code: "CS401", department: "Computer Science", semester: 4, credits: 4, type: "Theory" },
      { name: "Web Technologies", code: "CS402", department: "Computer Science", semester: 4, credits: 3, type: "Both" },
      { name: "Computer Networks", code: "CS501", department: "Computer Science", semester: 5, credits: 4, type: "Theory" },
      { name: "Thermodynamics", code: "ME301", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Structural Analysis", code: "CE301", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Circuit Theory", code: "EE301", department: "Electrical Engineering", semester: 3, credits: 4, type: "Both" },
    ];
    const courses = await Course.insertMany(courseData);

    // ─── Create Faculty ──────────────────────────────────────
    const facultyData = [
      { name: "Dr. Priya Sharma", email: "priya@educore.edu", password: "Faculty@1234", phone: "9000000002", employeeId: "FAC001", department: "Computer Science" },
      { name: "Prof. Rajesh Kumar", email: "rajesh@educore.edu", password: "Faculty@1234", phone: "9000000003", employeeId: "FAC002", department: "Computer Science" },
      { name: "Dr. Anita Patel", email: "anita@educore.edu", password: "Faculty@1234", phone: "9000000004", employeeId: "FAC003", department: "Mechanical Engineering" },
      { name: "Prof. Suresh Verma", email: "suresh@educore.edu", password: "Faculty@1234", phone: "9000000005", employeeId: "FAC004", department: "Civil Engineering" },
    ];

    const facultyUsers = [];
    const facultyRecords = [];
    for (let i = 0; i < facultyData.length; i++) {
      const { name, email, password, phone, employeeId, department } = facultyData[i];
      const user = await User.create({ name, email, password, phone, role: "faculty" });
      const cs_courses = courses.filter(c => c.department === department).map(c => c._id);
      const faculty = await Faculty.create({
        userId: user._id, employeeId, department,
        designation: i === 0 ? "Associate Professor" : "Assistant Professor",
        qualification: ["B.Tech", "M.Tech", i < 2 ? "Ph.D" : undefined].filter(Boolean),
        subjectsAssigned: cs_courses.slice(0, 2),
        joiningDate: new Date(2019 + i, 6, 1), experience: 5 - i
      });
      facultyUsers.push(user);
      facultyRecords.push(faculty);
    }

    // Assign faculty to courses
    await Course.findByIdAndUpdate(courses[0]._id, { assignedFaculty: facultyRecords[0]._id });
    await Course.findByIdAndUpdate(courses[1]._id, { assignedFaculty: facultyRecords[0]._id });
    await Course.findByIdAndUpdate(courses[2]._id, { assignedFaculty: facultyRecords[1]._id });

    // ─── Create Students ─────────────────────────────────────
    const studentNames = [
      "Aarav Mehta", "Priya Patel", "Rohan Singh", "Sneha Joshi", "Karan Shah",
      "Ananya Desai", "Vikram Rao", "Neha Gupta", "Arjun Nair", "Pooja Iyer",
      "Rahul Sharma", "Divya Kapoor", "Aditya Verma", "Meera Kumar", "Sanjay Das"
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const dept = DEPARTMENTS[i % 3];
      const sem = [3, 4, 5][i % 3];
      const admYear = 2022 + Math.floor(i / 5);
      const rollNo = `${dept.split(" ").map(w=>w[0]).join("")}${admYear}${String(i+1).padStart(3,"0")}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@student.educore.edu`;

      const user = await User.create({
        name, email, password: "Student@1234",
        phone: `90000${String(10010 + i).slice(-5)}`, role: "student"
      });

      const student = await Student.create({
        userId: user._id, rollNo,
        department: dept, semester: sem, admissionYear: admYear,
        guardianName: `${name.split(" ")[1]} Sr.`,
        guardianPhone: `90001${String(10010 + i).slice(-5)}`,
        address: `${i+1} College Road, City`,
        dateOfBirth: new Date(2002, i % 12, (i % 28) + 1),
        gender: i % 3 === 0 ? "Female" : "Male",
        category: ["General", "OBC", "SC"][i % 3],
        status: "active"
      });

      // Create fee record
      await Fee.create({
        student: student._id, semester: sem,
        academicYear: `${admYear}-${admYear + 1}`,
        feeBreakdown: { tuition: 45000, lab: 5000, library: 2000, sports: 1500, misc: 500 },
        totalAmount: 54000,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        paymentHistory: i < 10 ? [{
          amount: i < 7 ? 54000 : 27000,
          date: new Date(new Date().setDate(new Date().getDate() - (i * 10))),
          method: ["cash", "online", "cheque"][i % 3],
          receiptNo: `RCP-SEED-${String(i+1).padStart(3,"0")}`
        }] : []
      });
    }

    // ─── Create Notices ──────────────────────────────────────
    await Notice.insertMany([
      {
        title: "Mid-Semester Examination Schedule Released",
        description: "The schedule for mid-semester examinations has been released. All students are requested to check the timetable on the portal.",
        category: "Exam", postedBy: adminUser._id, targetAudience: "students",
        isPinned: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Independence Day Celebration",
        description: "All students and faculty are cordially invited to attend the Independence Day celebration on 15th August at the college ground.",
        category: "Event", postedBy: adminUser._id, targetAudience: "all",
        isPinned: false, expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Last Date for Fee Submission",
        description: "All students are informed that the last date for fee submission for this semester is approaching. Please clear dues before the deadline.",
        category: "Fee", postedBy: adminUser._id, targetAudience: "students",
        isPinned: true, expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
    ]);

    // ─── Create Exams ────────────────────────────────────────
    await Exam.insertMany([
      {
        name: "Mid-Term Examination - CS301",
        type: "Mid-Term", course: courses[0]._id,
        department: "Computer Science", semester: 3,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: "10:00", endTime: "12:00", room: "A-101",
        totalMarks: 100, passingMarks: 40, status: "scheduled"
      },
      {
        name: "Database Lab Practical - CS302",
        type: "Practical", course: courses[1]._id,
        department: "Computer Science", semester: 3,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startTime: "14:00", endTime: "17:00", room: "Lab-2",
        totalMarks: 50, passingMarks: 20, status: "scheduled"
      }
    ]);

    console.log("\n✅ Database seeded successfully!");
    console.log("─────────────────────────────────────");
    console.log("Admin:    admin@educore.edu  /  Admin@1234");
    console.log("Faculty:  priya@educore.edu  /  Faculty@1234");
    console.log("Student:  aarav.mehta@student.educore.edu  /  Student@1234");
    console.log("─────────────────────────────────────\n");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();
