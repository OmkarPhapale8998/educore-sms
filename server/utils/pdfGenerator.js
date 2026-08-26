// ============================================================
// utils/pdfGenerator.js
// Builds the student marksheet PDF using the pdfkit library.
// It draws text and shapes onto an A4 page, then streams the
// finished file straight into the HTTP response (no temp file).
// ============================================================
const PDFDocument = require("pdfkit");

// Brand colors used throughout the document
const COLORS = {
  primary: "#00236f",
  accent: "#4f7cff",
  light: "#f0f4ff",
  text: "#1a1a2e",
  muted: "#6c7894",
  success: "#22c55e",
  danger: "#ef4444"
};

// Draws the blue banner at the top of every page:
// college name on the left, report title on the right
const drawHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
  doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("EduCore SMS", 40, 20);
  doc.fontSize(10).font("Helvetica").text("Diploma Engineering College", 40, 46);
  doc.fillColor("white").fontSize(14).font("Helvetica-Bold")
    .text(title, 0, 28, { align: "right", width: doc.page.width - 40 });
  doc.moveDown(4);
};

// Thin horizontal divider line under section titles
const drawLine = (doc) => {
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(COLORS.accent);
  doc.moveDown(0.5);
};

// One label + value pair at a given x/y position
const field = (doc, label, value, x, y) => {
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(label, x, y);
  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold").text(value || "N/A", x, y + 14);
};

// Generate marksheet PDF
// `marks` = nested student/exam/course data; `stream` = where the PDF goes
exports.generateMarksheet = (marks, stream) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(stream); // everything drawn below is sent to the response

  drawHeader(doc, "MARKS STATEMENT");

  const student = marks.student;
  const userName = student && student.userId ? student.userId.name : "Student";

  // Section 1: who this marksheet belongs to
  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text("Student Details", 40, doc.y + 10);
  drawLine(doc);

  // Two fields side by side: name at x=40, roll no at x=300
  const y1 = doc.y;
  field(doc, "Student Name", userName, 40, y1);
  field(doc, "Roll No", student ? student.rollNo : "", 300, y1);
  doc.moveDown(4);

  // Section 2: which exam and course
  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text("Examination Details", 40, doc.y + 10);
  drawLine(doc);

  const y2 = doc.y;
  field(doc, "Exam", marks.exam ? marks.exam.name : "", 40, y2);
  field(doc, "Type", marks.exam ? marks.exam.type : "", 300, y2);
  doc.moveDown(3);

  const y3 = doc.y;
  field(doc, "Course", marks.course ? marks.course.name : "", 40, y3);
  field(doc, "Course Code", marks.course ? marks.course.code : "", 300, y3);
  doc.moveDown(4);

  // Score box
  // Light-blue box showing marks, percentage and grade in columns
  const boxY = doc.y;
  doc.rect(40, boxY, doc.page.width - 80, 80).fill(COLORS.light);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold")
    .text("Marks Obtained", 60, boxY + 10);
  doc.fillColor(COLORS.primary).fontSize(20).font("Helvetica-Bold")
    .text(marks.totalObtained + " / " + marks.totalMaximum, 60, boxY + 28);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold")
    .text("Percentage", 220, boxY + 10);
  doc.fillColor(COLORS.primary).fontSize(20)
    .text(marks.percentage + "%", 220, boxY + 28);

  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold")
    .text("Grade", 360, boxY + 10);
  doc.fillColor(COLORS.primary).fontSize(24)
    .text(marks.grade, 360, boxY + 24);

  // PASS/FAIL badge: green when passed, red for F grade
  const passColor = marks.grade === "F" ? COLORS.danger : COLORS.success;
  const passText = marks.grade === "F" ? "FAIL" : "PASS";
  const badgeX = doc.page.width - 120;
  doc.rect(badgeX, boxY + 15, 80, 40).fill(marks.grade === "F" ? "#fef2f2" : "#f0fdf4");
  doc.fillColor(passColor).fontSize(16).font("Helvetica-Bold")
    .text(passText, badgeX, boxY + 26, { width: 80, align: "center" });

  // Footer note, then finish writing so the PDF is finalized
  doc.moveDown(8);
  doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
    .text("This is a computer-generated marksheet.", { align: "center" });

  doc.end();
};
