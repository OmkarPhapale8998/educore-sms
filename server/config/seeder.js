// ============================================================
// config/seeder.js
// Fills the database with sample data (admin, courses, faculty,
// students, notices, exams) for testing/demo purposes.
// Run it manually with: node config/seeder.js
// WARNING: it wipes existing data first (TRUNCATE).
// ============================================================
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
const { pool, query } = require("./db");

// Departments used to spread the sample students around
const DEPARTMENTS = [
  "Computer Science", "Mechanical Engineering", "Civil Engineering",
  "Electrical Engineering", "Electronics", "Information Technology",
  "Automobile Engineering"
];

const seed = async () => {
  try {
    await query("SELECT 1"); // test query to confirm DB is reachable
    console.log("Connected to PostgreSQL (Supabase)...");

    // Wipe all tables (children first via CASCADE) so seeding starts clean
    await query(`TRUNCATE timetable_slots, timetables, notifications, notices,
      marks, exams, attendances, syllabus_materials, syllabus_units, faculty_courses, courses,
      faculties, student_documents, students, users CASCADE`);
    console.log("Cleared existing data...");

    // Insert the admin account (password hashed before saving)
    const adminRes = await query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1,$2,$3,'admin',$4) RETURNING id`,
      ["Admin User", "admin@educore.edu", await bcrypt.hash("Admin@1234", 12), "9000000001"]
    );
    const adminId = adminRes.rows[0].id;

    console.log("Inserting courses...");
    // Load course list from the JSON file and remember each course's new id by its code
    const courses = require("./courses_pg_seed.json");
    const courseIds = {};
    for (const c of courses) {
      const res = await query(
        `INSERT INTO courses (name, code, department, semester, credits, type)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [c.name, c.code, c.department, c.semester, c.credits, c.type]
      );
      courseIds[c.code] = res.rows[0].id;
    }

    // Sample faculty members
    const facultyData = [
      { name: "Dr. Priya Sharma", email: "priya@educore.edu", phone: "9000000002", employeeId: "FAC001", department: "Computer Science" },
      { name: "Prof. Rajesh Kumar", email: "rajesh@educore.edu", phone: "9000000003", employeeId: "FAC002", department: "Computer Science" },
      { name: "Dr. Anita Patel", email: "anita@educore.edu", phone: "9000000004", employeeId: "FAC003", department: "Mechanical Engineering" },
      { name: "Prof. Suresh Verma", email: "suresh@educore.edu", phone: "9000000005", employeeId: "FAC004", department: "Civil Engineering" }
    ];

    const facultyIds = [];
    // Each faculty needs both a login (users row) and a profile (faculties row)
    for (let i = 0; i < facultyData.length; i++) {
      const f = facultyData[i];
      const userRes = await query(
        `INSERT INTO users (name, email, password, role, phone)
         VALUES ($1,$2,$3,'faculty',$4) RETURNING id`,
        [f.name, f.email, await bcrypt.hash("Faculty@1234", 12), f.phone]
      );
      const userId = userRes.rows[0].id;
      const qual = ["B.Tech", "M.Tech", ...(i < 2 ? ["Ph.D"] : [])]; // first two get Ph.D too
      const facRes = await query(
        `INSERT INTO faculties (user_id, employee_id, department, designation, qualification, joining_date, experience)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [userId, f.employeeId, f.department, i === 0 ? "Associate Professor" : "Assistant Professor",
         qual, `${2019 + i}-07-01`, 5 - i]
      );
      facultyIds.push(facRes.rows[0].id);
    }

    // Assign each faculty the first 2 courses of their department (by code prefix)
    const assignMap = [
      ["FAC001", "Computer Science", "CO"],
      ["FAC002", "Computer Science", "CO"],
      ["FAC003", "Mechanical Engineering", "ME"],
      ["FAC004", "Civil Engineering", "CE"]
    ];
    for (let i = 0; i < assignMap.length; i++) {
      const [, , prefix] = assignMap[i];
      const codes = Object.keys(courseIds).filter((c) => c.startsWith(prefix)).sort();
      for (const code of codes.slice(0, 2)) {
        await query(`INSERT INTO faculty_courses (faculty_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [facultyIds[i], courseIds[code]]);
      }
    }

    // Mark CO101-CO103 as officially assigned to specific faculty
    await query(`UPDATE courses SET assigned_faculty_id=$1 WHERE id=$2`, [facultyIds[0], courseIds["CO101"]]);
    await query(`UPDATE courses SET assigned_faculty_id=$1 WHERE id=$2`, [facultyIds[0], courseIds["CO102"]]);
    await query(`UPDATE courses SET assigned_faculty_id=$1 WHERE id=$2`, [facultyIds[1], courseIds["CO103"]]);

    console.log("Inserting students...");
    const studentNames = [
      "Aarav Mehta", "Priya Patel", "Rohan Singh", "Sneha Joshi", "Karan Shah",
      "Ananya Desai", "Vikram Rao", "Neha Gupta", "Arjun Nair", "Pooja Iyer",
      "Rahul Sharma", "Divya Kapoor", "Aditya Verma", "Meera Kumar", "Sanjay Das"
    ];

    // Create a user + student profile for each name
    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const dept = DEPARTMENTS[i % 3];
      const sem = [3, 4, 5][i % 3];
      const admYear = 2022 + Math.floor(i / 5); // 5 students per admission year
      // Roll number = department initials + admission year + serial (e.g. CS2022001)
      const rollNo = `${dept.split(" ").map(w => w[0]).join("")}${admYear}${String(i + 1).padStart(3, "0")}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@student.educore.edu`;

      const userRes = await query(
        `INSERT INTO users (name, email, password, role, phone)
         VALUES ($1,$2,$3,'student',$4) RETURNING id`,
        [name, email, await bcrypt.hash("Student@1234", 12), `90000${String(10010 + i).slice(-5)}`]
      );
      const userId = userRes.rows[0].id;

      const stuRes = await query(
        `INSERT INTO students (user_id, roll_no, department, semester, admission_year, guardian_name, guardian_phone, address, date_of_birth, gender, category, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active') RETURNING id`,
        [userId, rollNo, dept, sem, admYear,
         `${name.split(" ")[1]} Sr.`, `90001${String(10010 + i).slice(-5)}`,
         `${i + 1} College Road, City`, `200${2}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
         i % 3 === 0 ? "Female" : "Male", ["General", "OBC", "SC"][i % 3]]
      );
    }

    console.log("Inserting notices...");
    await query(
      `INSERT INTO notices (title, description, category, posted_by, target_audience, is_pinned, expires_at) VALUES
       ('Mid-Semester Examination Schedule Released','The schedule for mid-semester examinations has been released. All students are requested to check the timetable on the portal.','Exam',$1,'students',true, now() + interval '30 days'),
       ('Independence Day Celebration','All students and faculty are cordially invited to attend the Independence Day celebration on 15th August at the college ground.','Event',$1,'all',false, now() + interval '20 days')`,
      [adminId]
    );

    console.log("Inserting exams...");
    // Two upcoming exams scheduled relative to today's date
    await query(
      `INSERT INTO exams (name, type, course_id, department, semester, date, start_time, end_time, room, total_marks, passing_marks, status) VALUES
       ('Mid-Term Examination - CO101','Mid-Term',$1,'Computer Science',1,(CURRENT_DATE + 7),'10:00','12:00','A-101',100,40,'scheduled'),
       ('Practical Exam - CO102','Practical',$2,'Computer Science',1,(CURRENT_DATE + 3),'14:00','17:00','Lab-2',50,20,'scheduled')`,
      [courseIds["CO101"], courseIds["CO102"]]
    );

    // Print demo login credentials so they can be used for testing
    console.log("\n✅ Database seeded successfully!");
    console.log("─".repeat(37));
    console.log("Admin:    admin@educore.edu  /  Admin@1234");
    console.log("Faculty:  priya@educore.edu  /  Faculty@1234");
    console.log("Student:  aarav.mehta@student.educore.edu  /  Student@1234");
    console.log("─".repeat(37) + "\n");
    await pool.end(); // close DB connections
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();
