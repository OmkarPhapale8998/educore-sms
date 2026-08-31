const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Course = require("./models/Course");
const Faculty = require("./models/Faculty");

const coursesData = [
  // ==========================================
  // COMPUTER SCIENCE (Semesters 1 to 6)
  // ==========================================
  // Semester 1
  {
    name: "Programming in C & Problem Solving",
    code: "CS101",
    department: "Computer Science",
    semester: 1,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Introduction to Algorithms & Flowcharts", position: 1, completed: true },
      { title: "Unit 2: C Fundamentals & Control Structures", position: 2, completed: true },
      { title: "Unit 3: Functions, Arrays & Strings", position: 3, completed: false },
      { title: "Unit 4: Pointers & Dynamic Memory Allocation", position: 4, completed: false },
      { title: "Unit 5: Structures, Unions & File I/O", position: 5, completed: false }
    ]
  },
  {
    name: "Engineering Mathematics - I",
    code: "CS102",
    department: "Computer Science",
    semester: 1,
    credits: 4,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Linear Algebra & Matrices", position: 1, completed: true },
      { title: "Unit 2: Differential Calculus", position: 2, completed: false },
      { title: "Unit 3: Integral Calculus & Applications", position: 3, completed: false }
    ]
  },
  {
    name: "Digital Logic & Computer Design",
    code: "CS103",
    department: "Computer Science",
    semester: 1,
    credits: 3,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Number Systems & Boolean Algebra", position: 1, completed: true },
      { title: "Unit 2: Combinational Logic Circuits", position: 2, completed: false },
      { title: "Unit 3: Sequential Circuits & Flip-Flops", position: 3, completed: false }
    ]
  },
  {
    name: "Technical Communication & Ethics",
    code: "CS104",
    department: "Computer Science",
    semester: 1,
    credits: 2,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Communication Skills & Presentation", position: 1, completed: true },
      { title: "Unit 2: Professional Ethics in Computing", position: 2, completed: false }
    ]
  },

  // Semester 2
  {
    name: "Data Structures & Algorithms",
    code: "CS201",
    department: "Computer Science",
    semester: 2,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Stacks, Queues & Linked Lists", position: 1, completed: true },
      { title: "Unit 2: Trees & Binary Search Trees", position: 2, completed: true },
      { title: "Unit 3: Graphs & Graph Traversals (BFS/DFS)", position: 3, completed: false },
      { title: "Unit 4: Sorting & Searching Algorithms", position: 4, completed: false },
      { title: "Unit 5: Hashing & Symbol Tables", position: 5, completed: false }
    ]
  },
  {
    name: "Object Oriented Programming using C++",
    code: "CS202",
    department: "Computer Science",
    semester: 2,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: OOP Principles & Classes", position: 1, completed: true },
      { title: "Unit 2: Inheritance & Polymorphism", position: 2, completed: false },
      { title: "Unit 3: Templates & Exception Handling", position: 3, completed: false },
      { title: "Unit 4: Standard Template Library (STL)", position: 4, completed: false }
    ]
  },
  {
    name: "Engineering Mathematics - II",
    code: "CS203",
    department: "Computer Science",
    semester: 2,
    credits: 4,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Vector Calculus", position: 1, completed: true },
      { title: "Unit 2: Complex Variables", position: 2, completed: false },
      { title: "Unit 3: Probability & Statistics", position: 3, completed: false }
    ]
  },
  {
    name: "Computer Organization & Architecture",
    code: "CS204",
    department: "Computer Science",
    semester: 2,
    credits: 3,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Basic Structure of Computers", position: 1, completed: true },
      { title: "Unit 2: Instruction Set & Addressing Modes", position: 2, completed: false },
      { title: "Unit 3: Memory Hierarchy & Cache Design", position: 3, completed: false }
    ]
  },

  // Semester 3
  {
    name: "Database Management Systems",
    code: "CS301",
    department: "Computer Science",
    semester: 3,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Relational Model & SQL Queries", position: 1, completed: true },
      { title: "Unit 2: ER Diagrams & Schema Normalization (1NF-BCNF)", position: 2, completed: true },
      { title: "Unit 3: Transaction Processing & ACID Properties", position: 3, completed: false },
      { title: "Unit 4: Concurrency Control & Indexing", position: 4, completed: false },
      { title: "Unit 5: NoSQL & Modern Databases", position: 5, completed: false }
    ]
  },
  {
    name: "Java Application Development",
    code: "CS302",
    department: "Computer Science",
    semester: 3,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Core Java & JVM Architecture", position: 1, completed: true },
      { title: "Unit 2: Multithreading & Concurrency", position: 2, completed: false },
      { title: "Unit 3: Java Collections Framework", position: 3, completed: false },
      { title: "Unit 4: JDBC & GUI Programming", position: 4, completed: false }
    ]
  },
  {
    name: "Operating Systems",
    code: "CS303",
    department: "Computer Science",
    semester: 3,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Processes, Threads & CPU Scheduling", position: 1, completed: true },
      { title: "Unit 2: Process Synchronization & Deadlocks", position: 2, completed: false },
      { title: "Unit 3: Virtual Memory Management", position: 3, completed: false },
      { title: "Unit 4: File Systems & Storage Management", position: 4, completed: false }
    ]
  },
  {
    name: "Discrete Mathematics",
    code: "CS304",
    department: "Computer Science",
    semester: 3,
    credits: 3,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Set Theory & Relations", position: 1, completed: true },
      { title: "Unit 2: Propositional & Predicate Logic", position: 2, completed: false },
      { title: "Unit 3: Graph Theory & Combinatorics", position: 3, completed: false }
    ]
  },

  // Semester 4
  {
    name: "Computer Networks & Protocols",
    code: "CS401",
    department: "Computer Science",
    semester: 4,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: OSI & TCP/IP Reference Models", position: 1, completed: true },
      { title: "Unit 2: Data Link Layer & MAC Protocols", position: 2, completed: true },
      { title: "Unit 3: Network Layer & Routing Algorithms", position: 3, completed: false },
      { title: "Unit 4: Transport Protocols (TCP/UDP)", position: 4, completed: false },
      { title: "Unit 5: Application Layer & Network Security", position: 5, completed: false }
    ]
  },
  {
    name: "Software Engineering & Agile",
    code: "CS402",
    department: "Computer Science",
    semester: 4,
    credits: 3,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: SDLC Models & Agile Scrum", position: 1, completed: true },
      { title: "Unit 2: Requirement Analysis & UML", position: 2, completed: false },
      { title: "Unit 3: Software Testing & Maintenance", position: 3, completed: false }
    ]
  },
  {
    name: "Python for Data Science",
    code: "CS403",
    department: "Computer Science",
    semester: 4,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: NumPy & Pandas for Data Manipulation", position: 1, completed: true },
      { title: "Unit 2: Data Visualization (Matplotlib/Seaborn)", position: 2, completed: false },
      { title: "Unit 3: Statistical Analysis with SciPy", position: 3, completed: false }
    ]
  },
  {
    name: "Microprocessors & Embedded Systems",
    code: "CS404",
    department: "Computer Science",
    semester: 4,
    credits: 3,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: 8086 Architecture & Assembly", position: 1, completed: true },
      { title: "Unit 2: ARM & Microcontroller Interfacing", position: 2, completed: false },
      { title: "Unit 3: Real-Time Operating Systems (RTOS)", position: 3, completed: false }
    ]
  },

  // Semester 5
  {
    name: "Artificial Intelligence & Machine Learning",
    code: "CS501",
    department: "Computer Science",
    semester: 5,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Search Algorithms & Knowledge Representation", position: 1, completed: true },
      { title: "Unit 2: Supervised Learning (Regression & Classification)", position: 2, completed: true },
      { title: "Unit 3: Unsupervised Learning & Clustering", position: 3, completed: false },
      { title: "Unit 4: Neural Networks Fundamentals", position: 4, completed: false }
    ]
  },
  {
    name: "Full Stack Web Development (MERN)",
    code: "CS502",
    department: "Computer Science",
    semester: 5,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Modern JavaScript (ES6+) & TypeScript", position: 1, completed: true },
      { title: "Unit 2: React.js Component Architecture & State", position: 2, completed: true },
      { title: "Unit 3: Node.js, Express & RESTful APIs", position: 3, completed: false },
      { title: "Unit 4: MongoDB, Mongoose & Authentication", position: 4, completed: false }
    ]
  },
  {
    name: "Information & Network Security",
    code: "CS503",
    department: "Computer Science",
    semester: 5,
    credits: 3,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Cryptography & Symmetric/Asymmetric Ciphers", position: 1, completed: true },
      { title: "Unit 2: Public Key Infrastructure & Digital Signatures", position: 2, completed: false },
      { title: "Unit 3: Firewalls, IDS & Cyber Defense", position: 3, completed: false }
    ]
  },
  {
    name: "Cloud Computing & DevOps",
    code: "CS504",
    department: "Computer Science",
    semester: 5,
    credits: 3,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Cloud Architecture (AWS/Azure/GCP)", position: 1, completed: true },
      { title: "Unit 2: Docker Containerization & Microservices", position: 2, completed: false },
      { title: "Unit 3: CI/CD Pipelines & Kubernetes", position: 3, completed: false }
    ]
  },

  // Semester 6
  {
    name: "Big Data Analytics & Hadoop",
    code: "CS601",
    department: "Computer Science",
    semester: 6,
    credits: 4,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: Big Data Ecosystem & Hadoop Architecture", position: 1, completed: true },
      { title: "Unit 2: MapReduce & Apache Spark", position: 2, completed: false },
      { title: "Unit 3: Hive, Pig & NoSQL Data Warehousing", position: 3, completed: false },
      { title: "Unit 4: Real-time Stream Processing with Kafka", position: 4, completed: false }
    ]
  },
  {
    name: "Internet of Things (IoT) Systems",
    code: "CS602",
    department: "Computer Science",
    semester: 6,
    credits: 3,
    type: "Both",
    syllabus_units: [
      { title: "Unit 1: IoT Architecture, Sensors & Actuators", position: 1, completed: true },
      { title: "Unit 2: Wireless Protocols (MQTT, CoAP, Zigbee)", position: 2, completed: false },
      { title: "Unit 3: Edge Computing & IoT Cloud Platforms", position: 3, completed: false }
    ]
  },
  {
    name: "Software Quality Assurance & Testing",
    code: "CS603",
    department: "Computer Science",
    semester: 6,
    credits: 3,
    type: "Theory",
    syllabus_units: [
      { title: "Unit 1: Test Planning & Test Case Design", position: 1, completed: true },
      { title: "Unit 2: Automated Testing with Selenium & Jest", position: 2, completed: false },
      { title: "Unit 3: Performance, Load & Security Testing", position: 3, completed: false }
    ]
  },
  {
    name: "Major Capstone Project & Internship",
    code: "CS604",
    department: "Computer Science",
    semester: 6,
    credits: 6,
    type: "Practical",
    syllabus_units: [
      { title: "Phase 1: Problem Definition & Literature Survey", position: 1, completed: true },
      { title: "Phase 2: System Architecture & Implementation", position: 2, completed: true },
      { title: "Phase 3: Testing, Deployment & Viva Voce", position: 3, completed: false }
    ]
  },

  // ==========================================
  // INFORMATION TECHNOLOGY (Semesters 1 to 6)
  // ==========================================
  { name: "IT Fundamentals & Web Foundations", code: "IT101", department: "Information Technology", semester: 1, credits: 4, type: "Both" },
  { name: "Engineering Math for IT - I", code: "IT102", department: "Information Technology", semester: 1, credits: 4, type: "Theory" },
  { name: "Data Structures for IT", code: "IT201", department: "Information Technology", semester: 2, credits: 4, type: "Both" },
  { name: "Database Engineering", code: "IT301", department: "Information Technology", semester: 3, credits: 4, type: "Both" },
  { name: "Web Application Frameworks", code: "IT401", department: "Information Technology", semester: 4, credits: 4, type: "Both" },
  { name: "Enterprise Cloud Systems", code: "IT501", department: "Information Technology", semester: 5, credits: 4, type: "Both" },
  { name: "IT Project & Industry Capstone", code: "IT601", department: "Information Technology", semester: 6, credits: 6, type: "Practical" },

  // ==========================================
  // MECHANICAL ENGINEERING (Semesters 1 to 6)
  // ==========================================
  { name: "Engineering Mechanics", code: "ME101", department: "Mechanical Engineering", semester: 1, credits: 4, type: "Both" },
  { name: "Thermodynamics", code: "ME201", department: "Mechanical Engineering", semester: 2, credits: 4, type: "Both" },
  { name: "Strength of Materials", code: "ME301", department: "Mechanical Engineering", semester: 3, credits: 4, type: "Both" },
  { name: "Fluid Mechanics & Machinery", code: "ME401", department: "Mechanical Engineering", semester: 4, credits: 4, type: "Both" },
  { name: "Heat Transfer & Refrigeration", code: "ME501", department: "Mechanical Engineering", semester: 5, credits: 4, type: "Both" },
  { name: "Automated Manufacturing & Robotics", code: "ME601", department: "Mechanical Engineering", semester: 6, credits: 6, type: "Practical" },

  // ==========================================
  // CIVIL ENGINEERING (Semesters 1 to 6)
  // ==========================================
  { name: "Basic Surveying & Geomatics", code: "CE101", department: "Civil Engineering", semester: 1, credits: 4, type: "Both" },
  { name: "Building Materials & Construction", code: "CE201", department: "Civil Engineering", semester: 2, credits: 4, type: "Both" },
  { name: "Structural Analysis", code: "CE301", department: "Civil Engineering", semester: 3, credits: 4, type: "Both" },
  { name: "Geotechnical Engineering", code: "CE401", department: "Civil Engineering", semester: 4, credits: 4, type: "Both" },
  { name: "Environmental Engineering", code: "CE501", department: "Civil Engineering", semester: 5, credits: 4, type: "Both" },
  { name: "Major Civil Design Project", code: "CE601", department: "Civil Engineering", semester: 6, credits: 6, type: "Practical" },

  // ==========================================
  // ELECTRICAL ENGINEERING (Semesters 1 to 6)
  // ==========================================
  { name: "Basic Electrical Circuit Analysis", code: "EE101", department: "Electrical Engineering", semester: 1, credits: 4, type: "Both" },
  { name: "Electrical Machines - I", code: "EE201", department: "Electrical Engineering", semester: 2, credits: 4, type: "Both" },
  { name: "Power Systems - I", code: "EE301", department: "Electrical Engineering", semester: 3, credits: 4, type: "Both" },
  { name: "Control Systems", code: "EE401", department: "Electrical Engineering", semester: 4, credits: 4, type: "Both" },
  { name: "Power Electronics & Drives", code: "EE501", department: "Electrical Engineering", semester: 5, credits: 4, type: "Both" },
  { name: "Renewable Energy Systems Project", code: "EE601", department: "Electrical Engineering", semester: 6, credits: 6, type: "Practical" },

  // ==========================================
  // ELECTRONICS (Semesters 1 to 6)
  // ==========================================
  { name: "Electronic Devices & Circuits", code: "EC101", department: "Electronics", semester: 1, credits: 4, type: "Both" },
  { name: "Signals & Systems", code: "EC201", department: "Electronics", semester: 2, credits: 4, type: "Both" },
  { name: "Analog & Digital Communication", code: "EC301", department: "Electronics", semester: 3, credits: 4, type: "Both" },
  { name: "VLSI Design & Embedded Systems", code: "EC401", department: "Electronics", semester: 4, credits: 4, type: "Both" },
  { name: "Wireless Communication & 5G", code: "EC501", department: "Electronics", semester: 5, credits: 4, type: "Both" },
  { name: "Embedded IoT Capstone Project", code: "EC601", department: "Electronics", semester: 6, credits: 6, type: "Practical" },

  // ==========================================
  // AUTOMOBILE ENGINEERING (Semesters 1 to 6)
  // ==========================================
  { name: "Automotive Engines & Combustion", code: "AE101", department: "Automobile Engineering", semester: 1, credits: 4, type: "Both" },
  { name: "Automotive Transmission Systems", code: "AE201", department: "Automobile Engineering", semester: 2, credits: 4, type: "Both" },
  { name: "Vehicle Dynamics & Aerodynamics", code: "AE301", department: "Automobile Engineering", semester: 3, credits: 4, type: "Both" },
  { name: "Electric & Hybrid Vehicle Technology", code: "AE401", department: "Automobile Engineering", semester: 4, credits: 4, type: "Both" },
  { name: "Autonomous Vehicle Systems & ADAS", code: "AE501", department: "Automobile Engineering", semester: 5, credits: 4, type: "Both" },
  { name: "Automotive Capstone Design Project", code: "AE601", department: "Automobile Engineering", semester: 6, credits: 6, type: "Practical" }
];

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Course Seeding...");

    // Find any existing faculty to assign to relevant courses
    const facultyList = await Faculty.find();
    const csFaculty = facultyList.find(f => f.department === "Computer Science");

    let createdCount = 0;
    let updatedCount = 0;

    for (const cData of coursesData) {
      // Assign CS faculty to CS courses if available
      if (cData.department === "Computer Science" && csFaculty) {
        cData.assigned_faculty_id = csFaculty._id;
      }

      const existing = await Course.findOne({ code: cData.code });
      if (existing) {
        await Course.updateOne({ code: cData.code }, { $set: cData });
        updatedCount++;
      } else {
        await Course.create(cData);
        createdCount++;
      }
    }

    console.log(`✅ Course seeding completed: ${createdCount} created, ${updatedCount} updated.`);
    console.log(`Total courses available across all 6 semesters: ${coursesData.length}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding courses:", err);
    process.exit(1);
  }
};

seedCourses();
