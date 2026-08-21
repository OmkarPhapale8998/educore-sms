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
  "Electrical Engineering", "Electronics", "Information Technology",
  "Automobile Engineering"
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

    // ─── Create Admin ───────────────────────
    const adminUser = await User.create({
      name: "Admin User", email: "admin@educore.edu",
      password: "Admin@1234", role: "admin", phone: "9000000001"
    });

    // ─── Create Courses ────────────────────────
    const courseData = [
      { name: "Basic Mathematics", code: "CO101", department: "Computer Science", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "CO102", department: "Computer Science", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "CO103", department: "Computer Science", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "CO104", department: "Computer Science", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "CO105", department: "Computer Science", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "CO106", department: "Computer Science", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "CO107", department: "Computer Science", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "CO201", department: "Computer Science", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "CO202", department: "Computer Science", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "CO203", department: "Computer Science", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "CO204", department: "Computer Science", semester: 2, credits: 3, type: "Theory" },
      { name: "Programming in C", code: "CO205", department: "Computer Science", semester: 2, credits: 3, type: "Both" },
      { name: "Web Page Designing", code: "CO206", department: "Computer Science", semester: 2, credits: 3, type: "Both" },
      { name: "Linux Basics", code: "CO207", department: "Computer Science", semester: 2, credits: 3, type: "Theory" },
      { name: "Data Structures Using C", code: "CO301", department: "Computer Science", semester: 3, credits: 4, type: "Theory" },
      { name: "Database Management System", code: "CO302", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Digital Techniques", code: "CO303", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Computer Networks", code: "CO304", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Object Oriented Programming", code: "CO305", department: "Computer Science", semester: 3, credits: 4, type: "Both" },
      { name: "Environmental Studies", code: "CO306", department: "Computer Science", semester: 3, credits: 4, type: "Theory" },
      { name: "Operating System", code: "CO401", department: "Computer Science", semester: 4, credits: 4, type: "Theory" },
      { name: "Java Programming", code: "CO402", department: "Computer Science", semester: 4, credits: 4, type: "Both" },
      { name: "Web Development", code: "CO403", department: "Computer Science", semester: 4, credits: 4, type: "Both" },
      { name: "Data Communication & Networking", code: "CO404", department: "Computer Science", semester: 4, credits: 4, type: "Theory" },
      { name: "Software Engineering", code: "CO405", department: "Computer Science", semester: 4, credits: 4, type: "Theory" },
      { name: "Microprocessor & Assembly Language", code: "CO406", department: "Computer Science", semester: 4, credits: 4, type: "Theory" },
      { name: "Advanced Java Programming", code: "CO501", department: "Computer Science", semester: 5, credits: 4, type: "Both" },
      { name: "Mobile Application Development", code: "CO502", department: "Computer Science", semester: 5, credits: 4, type: "Both" },
      { name: "Software Testing", code: "CO503", department: "Computer Science", semester: 5, credits: 4, type: "Both" },
      { name: "Storage Area Network", code: "CO504", department: "Computer Science", semester: 5, credits: 4, type: "Theory" },
      { name: "Elective-I", code: "CO505", department: "Computer Science", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "CO506", department: "Computer Science", semester: 5, credits: 4, type: "Practical" },
      { name: "Cloud Computing", code: "CO601", department: "Computer Science", semester: 6, credits: 4, type: "Theory" },
      { name: "Machine Learning", code: "CO602", department: "Computer Science", semester: 6, credits: 4, type: "Theory" },
      { name: "Emerging Trends in Computer Engineering", code: "CO603", department: "Computer Science", semester: 6, credits: 4, type: "Theory" },
      { name: "Advanced Computer Networks", code: "CO604", department: "Computer Science", semester: 6, credits: 4, type: "Both" },
      { name: "Major Project", code: "CO605", department: "Computer Science", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "CO606", department: "Computer Science", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "ME101", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "ME102", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "ME103", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "ME104", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "ME105", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "ME106", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "ME107", department: "Mechanical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "ME201", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "ME202", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "ME203", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "ME204", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Engineering Mechanics", code: "ME205", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Basic Electrical & Electronics Engineering", code: "ME206", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Both" },
      { name: "Elements of Mechanical Engineering", code: "ME207", department: "Mechanical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Strength of Materials", code: "ME301", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Thermal Engineering-I", code: "ME302", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Manufacturing Processes-I", code: "ME303", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Fluid Mechanics & Machinery", code: "ME304", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Production Drawing", code: "ME305", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Environmental Studies", code: "ME306", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Theory of Machines", code: "ME401", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Thermal Engineering-II", code: "ME402", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Manufacturing Processes-II", code: "ME403", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Metrology & Quality Control", code: "ME404", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Machine Design", code: "ME405", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Industrial Engineering & Management", code: "ME406", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "CAD/CAM", code: "ME501", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Refrigeration & Air Conditioning", code: "ME502", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Power Plant Engineering", code: "ME503", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Automobile Engineering", code: "ME504", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Elective-I", code: "ME505", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "ME506", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Practical" },
      { name: "Mechatronics", code: "ME601", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Maintenance Engineering", code: "ME602", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "CNC Programming", code: "ME603", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Emerging Trends in Mechanical Engineering", code: "ME604", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Major Project", code: "ME605", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "ME606", department: "Mechanical Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "CE101", department: "Civil Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "CE102", department: "Civil Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "CE103", department: "Civil Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "CE104", department: "Civil Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "CE105", department: "Civil Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "CE106", department: "Civil Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "CE107", department: "Civil Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "CE201", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "CE202", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "CE203", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "CE204", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Engineering Mechanics", code: "CE205", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Basic Electrical & Electronics Engineering", code: "CE206", department: "Civil Engineering", semester: 2, credits: 3, type: "Both" },
      { name: "Building Construction Materials", code: "CE207", department: "Civil Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Building Construction", code: "CE301", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Surveying-I", code: "CE302", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Strength of Materials", code: "CE303", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Building Materials", code: "CE304", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Concrete Technology", code: "CE305", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Environmental Studies", code: "CE306", department: "Civil Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Surveying-II", code: "CE401", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Theory of Structures", code: "CE402", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Geotechnical Engineering", code: "CE403", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Transportation Engineering", code: "CE404", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Water Supply Engineering", code: "CE405", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Estimating & Costing", code: "CE406", department: "Civil Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Design of Steel Structures", code: "CE501", department: "Civil Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Design of RCC Structures", code: "CE502", department: "Civil Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Irrigation Engineering", code: "CE503", department: "Civil Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Environmental Engineering", code: "CE504", department: "Civil Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Elective-I", code: "CE505", department: "Civil Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "CE506", department: "Civil Engineering", semester: 5, credits: 4, type: "Practical" },
      { name: "Advanced Surveying", code: "CE601", department: "Civil Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Construction Management", code: "CE602", department: "Civil Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Estimation & Valuation", code: "CE603", department: "Civil Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Emerging Trends in Civil Engineering", code: "CE604", department: "Civil Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Major Project", code: "CE605", department: "Civil Engineering", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "CE606", department: "Civil Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "EE101", department: "Electrical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "EE102", department: "Electrical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "EE103", department: "Electrical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "EE104", department: "Electrical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "EE105", department: "Electrical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "EE106", department: "Electrical Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "EE107", department: "Electrical Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "EE201", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "EE202", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "EE203", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "EE204", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Engineering Mechanics", code: "EE205", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Elements of Electrical Engineering", code: "EE206", department: "Electrical Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Basic Electronics Engineering", code: "EE207", department: "Electrical Engineering", semester: 2, credits: 3, type: "Both" },
      { name: "Electrical Circuits & Networks", code: "EE301", department: "Electrical Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Electrical Power Generation", code: "EE302", department: "Electrical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Electrical Machines-I", code: "EE303", department: "Electrical Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Electronic Devices & Circuits", code: "EE304", department: "Electrical Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Electrical Wiring & Estimating", code: "EE305", department: "Electrical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Environmental Studies", code: "EE306", department: "Electrical Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Electrical Machines-II", code: "EE401", department: "Electrical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Power Electronics", code: "EE402", department: "Electrical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Transmission & Distribution", code: "EE403", department: "Electrical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Electrical Measurement & Instrumentation", code: "EE404", department: "Electrical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Control System", code: "EE405", department: "Electrical Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Industrial Electrical Systems", code: "EE406", department: "Electrical Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Switchgear & Protection", code: "EE501", department: "Electrical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Renewable Energy Sources", code: "EE502", department: "Electrical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "PLC & Automation", code: "EE503", department: "Electrical Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Electric Drives", code: "EE504", department: "Electrical Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Elective-I", code: "EE505", department: "Electrical Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "EE506", department: "Electrical Engineering", semester: 5, credits: 4, type: "Practical" },
      { name: "Utilization of Electrical Energy", code: "EE601", department: "Electrical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Electrical Design & Drawing", code: "EE602", department: "Electrical Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Emerging Trends in Electrical Engineering", code: "EE603", department: "Electrical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Power Plant Engineering", code: "EE604", department: "Electrical Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Major Project", code: "EE605", department: "Electrical Engineering", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "EE606", department: "Electrical Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "EJ101", department: "Electronics", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "EJ102", department: "Electronics", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "EJ103", department: "Electronics", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "EJ104", department: "Electronics", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "EJ105", department: "Electronics", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "EJ106", department: "Electronics", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "EJ107", department: "Electronics", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "EJ201", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "EJ202", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "EJ203", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "EJ204", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Engineering Mechanics", code: "EJ205", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Basic Electrical Engineering", code: "EJ206", department: "Electronics", semester: 2, credits: 3, type: "Theory" },
      { name: "Electronic Devices & Circuits Basics", code: "EJ207", department: "Electronics", semester: 2, credits: 3, type: "Both" },
      { name: "Electronic Circuits", code: "EJ301", department: "Electronics", semester: 3, credits: 4, type: "Both" },
      { name: "Digital Techniques", code: "EJ302", department: "Electronics", semester: 3, credits: 4, type: "Both" },
      { name: "Electrical Circuits & Networks", code: "EJ303", department: "Electronics", semester: 3, credits: 4, type: "Both" },
      { name: "Principles of Communication Engineering", code: "EJ304", department: "Electronics", semester: 3, credits: 4, type: "Both" },
      { name: "Consumer Electronics", code: "EJ305", department: "Electronics", semester: 3, credits: 4, type: "Both" },
      { name: "Environmental Studies", code: "EJ306", department: "Electronics", semester: 3, credits: 4, type: "Theory" },
      { name: "Microcontroller & Applications", code: "EJ401", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Linear Integrated Circuits", code: "EJ402", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Digital Communication", code: "EJ403", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Data Communication & Computer Networks", code: "EJ404", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Industrial Electronics", code: "EJ405", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Power Electronics", code: "EJ406", department: "Electronics", semester: 4, credits: 4, type: "Both" },
      { name: "Mobile Communication", code: "EJ501", department: "Electronics", semester: 5, credits: 4, type: "Theory" },
      { name: "Embedded Systems", code: "EJ502", department: "Electronics", semester: 5, credits: 4, type: "Both" },
      { name: "Optical Fiber Communication", code: "EJ503", department: "Electronics", semester: 5, credits: 4, type: "Theory" },
      { name: "VLSI Design", code: "EJ504", department: "Electronics", semester: 5, credits: 4, type: "Both" },
      { name: "Elective-I", code: "EJ505", department: "Electronics", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "EJ506", department: "Electronics", semester: 5, credits: 4, type: "Practical" },
      { name: "Internet of Things & Applications", code: "EJ601", department: "Electronics", semester: 6, credits: 4, type: "Both" },
      { name: "Satellite Communication", code: "EJ602", department: "Electronics", semester: 6, credits: 4, type: "Theory" },
      { name: "Emerging Trends in Electronics", code: "EJ603", department: "Electronics", semester: 6, credits: 4, type: "Both" },
      { name: "Robotics & Automation", code: "EJ604", department: "Electronics", semester: 6, credits: 4, type: "Both" },
      { name: "Major Project", code: "EJ605", department: "Electronics", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "EJ606", department: "Electronics", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "IF101", department: "Information Technology", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "IF102", department: "Information Technology", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "IF103", department: "Information Technology", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "IF104", department: "Information Technology", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "IF105", department: "Information Technology", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "IF106", department: "Information Technology", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "IF107", department: "Information Technology", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "IF201", department: "Information Technology", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "IF202", department: "Information Technology", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "IF203", department: "Information Technology", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "IF204", department: "Information Technology", semester: 2, credits: 3, type: "Theory" },
      { name: "Programming in C", code: "IF205", department: "Information Technology", semester: 2, credits: 3, type: "Both" },
      { name: "Web Page Designing", code: "IF206", department: "Information Technology", semester: 2, credits: 3, type: "Both" },
      { name: "Linux Basics", code: "IF207", department: "Information Technology", semester: 2, credits: 3, type: "Theory" },
      { name: "Data Structures Using C", code: "IF301", department: "Information Technology", semester: 3, credits: 4, type: "Theory" },
      { name: "Database Management System", code: "IF302", department: "Information Technology", semester: 3, credits: 4, type: "Both" },
      { name: "Digital Techniques", code: "IF303", department: "Information Technology", semester: 3, credits: 4, type: "Both" },
      { name: "Computer Networks", code: "IF304", department: "Information Technology", semester: 3, credits: 4, type: "Both" },
      { name: "Object Oriented Programming", code: "IF305", department: "Information Technology", semester: 3, credits: 4, type: "Both" },
      { name: "Environmental Studies", code: "IF306", department: "Information Technology", semester: 3, credits: 4, type: "Theory" },
      { name: "Operating System", code: "IF401", department: "Information Technology", semester: 4, credits: 4, type: "Theory" },
      { name: "Client-Side Scripting Language", code: "IF402", department: "Information Technology", semester: 4, credits: 4, type: "Theory" },
      { name: "Server-Side Scripting Language", code: "IF403", department: "Information Technology", semester: 4, credits: 4, type: "Theory" },
      { name: "Data Communication & Networking", code: "IF404", department: "Information Technology", semester: 4, credits: 4, type: "Theory" },
      { name: "Software Engineering", code: "IF405", department: "Information Technology", semester: 4, credits: 4, type: "Theory" },
      { name: "Java Programming", code: "IF406", department: "Information Technology", semester: 4, credits: 4, type: "Both" },
      { name: "Advanced Java Programming", code: "IF501", department: "Information Technology", semester: 5, credits: 4, type: "Both" },
      { name: "Mobile Application Development", code: "IF502", department: "Information Technology", semester: 5, credits: 4, type: "Both" },
      { name: "Internet of Things", code: "IF503", department: "Information Technology", semester: 5, credits: 4, type: "Theory" },
      { name: "Wireless Networks", code: "IF504", department: "Information Technology", semester: 5, credits: 4, type: "Both" },
      { name: "Elective-I", code: "IF505", department: "Information Technology", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "IF506", department: "Information Technology", semester: 5, credits: 4, type: "Practical" },
      { name: "Data Mining & Warehousing", code: "IF601", department: "Information Technology", semester: 6, credits: 4, type: "Theory" },
      { name: "Big Data Analytics", code: "IF602", department: "Information Technology", semester: 6, credits: 4, type: "Theory" },
      { name: "Emerging Trends in IT", code: "IF603", department: "Information Technology", semester: 6, credits: 4, type: "Theory" },
      { name: "Network Security", code: "IF604", department: "Information Technology", semester: 6, credits: 4, type: "Theory" },
      { name: "Major Project", code: "IF605", department: "Information Technology", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "IF606", department: "Information Technology", semester: 6, credits: 4, type: "Both" },
      { name: "Basic Mathematics", code: "AE101", department: "Automobile Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Basic Science", code: "AE102", department: "Automobile Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Communication Skills (English)", code: "AE103", department: "Automobile Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Engineering Graphics", code: "AE104", department: "Automobile Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Engineering Workshop Practice", code: "AE105", department: "Automobile Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Fundamentals of ICT", code: "AE106", department: "Automobile Engineering", semester: 1, credits: 3, type: "Theory" },
      { name: "Yoga and Meditation", code: "AE107", department: "Automobile Engineering", semester: 1, credits: 3, type: "Practical" },
      { name: "Applied Mathematics", code: "AE201", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Applied Science", code: "AE202", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Professional Communication", code: "AE203", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Social and Life Skills", code: "AE204", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Engineering Mechanics", code: "AE205", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Basic Electrical & Electronics Engineering", code: "AE206", department: "Automobile Engineering", semester: 2, credits: 3, type: "Both" },
      { name: "Elements of Automobile Engineering", code: "AE207", department: "Automobile Engineering", semester: 2, credits: 3, type: "Theory" },
      { name: "Automotive Chassis & Body Engineering", code: "AE301", department: "Automobile Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Strength of Materials", code: "AE302", department: "Automobile Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Manufacturing Processes-I", code: "AE303", department: "Automobile Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Automotive Engines", code: "AE304", department: "Automobile Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Fluid Mechanics & Machinery", code: "AE305", department: "Automobile Engineering", semester: 3, credits: 4, type: "Both" },
      { name: "Environmental Studies", code: "AE306", department: "Automobile Engineering", semester: 3, credits: 4, type: "Theory" },
      { name: "Automotive Transmission Systems", code: "AE401", department: "Automobile Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Automotive Electrical & Electronics", code: "AE402", department: "Automobile Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Manufacturing Processes-II", code: "AE403", department: "Automobile Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Vehicle Maintenance & Repair", code: "AE404", department: "Automobile Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Automotive Chassis Design", code: "AE405", department: "Automobile Engineering", semester: 4, credits: 4, type: "Both" },
      { name: "Industrial Management", code: "AE406", department: "Automobile Engineering", semester: 4, credits: 4, type: "Theory" },
      { name: "Automotive Air Conditioning", code: "AE501", department: "Automobile Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Vehicle Testing & Emission Control", code: "AE502", department: "Automobile Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Alternate Fuels & Energy Sources", code: "AE503", department: "Automobile Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Automotive Design", code: "AE504", department: "Automobile Engineering", semester: 5, credits: 4, type: "Both" },
      { name: "Elective-I", code: "AE505", department: "Automobile Engineering", semester: 5, credits: 4, type: "Theory" },
      { name: "Project Management", code: "AE506", department: "Automobile Engineering", semester: 5, credits: 4, type: "Practical" },
      { name: "Electric & Hybrid Vehicles", code: "AE601", department: "Automobile Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Advanced Automotive Systems", code: "AE602", department: "Automobile Engineering", semester: 6, credits: 4, type: "Both" },
      { name: "Emerging Trends in Automobile Engineering", code: "AE603", department: "Automobile Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Vehicle Body Engineering", code: "AE604", department: "Automobile Engineering", semester: 6, credits: 4, type: "Theory" },
      { name: "Major Project", code: "AE605", department: "Automobile Engineering", semester: 6, credits: 4, type: "Practical" },
      { name: "Professional Practices-III", code: "AE606", department: "Automobile Engineering", semester: 6, credits: 4, type: "Both" },
    ];
    const courses = await Course.insertMany(courseData);

    // ─── Create Faculty ───────────────────────
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

    // ─── Create Students ──────────────────────
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
      const rollNo = `${dept.split(" ").map(w => w[0]).join("")}${admYear}${String(i + 1).padStart(3, "0")}`;
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
        address: `${i + 1} College Road, City`,
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
          receiptNo: `RCP-SEED-${String(i + 1).padStart(3, "0")}`
        }] : []
      });
    }

    // ─── Create Notices ──────────────────────
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

    // ─── Create Exams ────────────────────────
    await Exam.insertMany([
      {
        name: `Mid-Term Examination - ${courses[0].code}`,
        type: "Mid-Term", course: courses[0]._id,
        department: "Computer Science", semester: courses[0].semester,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: "10:00", endTime: "12:00", room: "A-101",
        totalMarks: 100, passingMarks: 40, status: "scheduled"
      },
      {
        name: `Practical Exam - ${courses[1].code}`,
        type: "Practical", course: courses[1]._id,
        department: "Computer Science", semester: courses[1].semester,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startTime: "14:00", endTime: "17:00", room: "Lab-2",
        totalMarks: 50, passingMarks: 20, status: "scheduled"
      }
    ]);

    console.log("\n✅ Database seeded successfully!");
    console.log("─".repeat(37));
    console.log("Admin:    admin@educore.edu  /  Admin@1234");
    console.log("Faculty:  priya@educore.edu  /  Faculty@1234");
    console.log("Student:  aarav.mehta@student.educore.edu  /  Student@1234");
    console.log("─".repeat(37) + "\n");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();