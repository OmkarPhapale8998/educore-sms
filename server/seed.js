const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Load Models
const User = require("./models/User");
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Clear existing data
    await User.deleteMany();
    await Student.deleteMany();
    await Faculty.deleteMany();
    console.log("Cleared existing users, students, and faculty.");

    // Hash passwords
    const adminPass = await bcrypt.hash("Admin@1234", 12);
    const facultyPass = await bcrypt.hash("Faculty@1234", 12);
    const studentPass = await bcrypt.hash("Student@1234", 12);

    // 1. Create Admin
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@educore.edu",
      password: adminPass,
      role: "admin",
      phone: "1234567890",
      is_active: true
    });

    // 2. Create Faculty
    const facultyUser = await User.create({
      name: "Dr. Priya Sharma",
      email: "priya@educore.edu",
      password: facultyPass,
      role: "faculty",
      phone: "0987654321",
      is_active: true
    });

    await Faculty.create({
      user_id: facultyUser._id,
      employee_id: "FAC101",
      department: "Computer Science",
      designation: "Associate Professor",
      qualification: ["Ph.D", "M.Tech"],
      joining_date: new Date()
    });

    // 3. Create Student
    const studentUser = await User.create({
      name: "Aarav Mehta",
      email: "aarav.mehta@student.educore.edu",
      password: studentPass,
      role: "student",
      phone: "1122334455",
      is_active: true
    });

    await Student.create({
      user_id: studentUser._id,
      roll_no: "CS2023001",
      department: "Computer Science",
      semester: 1,
      admission_year: 2023,
      guardian_name: "Ramesh Mehta",
      guardian_phone: "9988776655"
    });

    console.log("Demo credentials created successfully!");
    console.log("Admin: admin@educore.edu / Admin@1234");
    console.log("Faculty: priya@educore.edu / Faculty@1234");
    console.log("Student: aarav.mehta@student.educore.edu / Student@1234");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

seedDatabase();
