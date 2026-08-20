const PDFDocument = require("pdfkit");

const COLORS = {
  primary: "#00236f",
  accent: "#4f7cff",
  light: "#f0f4ff",
  text: "#1a1a2e",
  muted: "#6c7894",
  success: "#22c55e",
  danger: "#ef4444"
};

const drawHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
  doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("EduCore SMS", 40, 20);
  doc.fontSize(10).font("Helvetica").text("Diploma Engineering College", 40, 46);
  doc.fillColor("white").fontSize(14).font("Helvetica-Bold")
    .text(title, 0, 28, { align: "right", width: doc.page.width - 40 });
  doc.moveDown(4);
};

const drawLine = (doc) => {
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(COLORS.accent);
  doc.moveDown(0.5);
};

const field = (doc, label, value, x, y) => {
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica").text(label, x, y);
  doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold").text(value || "N/A", x, y + 14);
};

// Generate fee receipt PDF — streams directly to response
exports.generateFeeReceipt = (fee, payment, stream) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(stream);

  drawHeader(doc, "PAYMENT RECEIPT");

  const student = fee.student;
  const userName = student && student.userId ? student.userId.name : "Student";

  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text("Student Information", 40, doc.y + 10);
  drawLine(doc);

  const y1 = doc.y;
  field(doc, "Student Name", userName, 40, y1);
  field(doc, "Roll No", student ? student.rollNo : "", 300, y1);
  doc.moveDown(3);

  const y2 = doc.y;
  field(doc, "Department", student ? student.department : "", 40, y2);
  field(doc, "Semester", student ? ("Semester " + student.semester) : "", 300, y2);
  doc.moveDown(4);

  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text("Payment Details", 40, doc.y + 10);
  drawLine(doc);

  const y3 = doc.y;
  field(doc, "Receipt No", payment.receiptNo, 40, y3);
  field(doc, "Payment Date", new Date(payment.date).toLocaleDateString("en-IN"), 300, y3);
  doc.moveDown(3);

  const y4 = doc.y;
  field(doc, "Amount Paid", "Rs. " + payment.amount.toLocaleString("en-IN"), 40, y4);
  field(doc, "Payment Method", (payment.method || "").toUpperCase(), 300, y4);
  doc.moveDown(3);

  const y5 = doc.y;
  field(doc, "Academic Year", fee.academicYear, 40, y5);
  field(doc, "Status", (fee.status || "").toUpperCase(), 300, y5);
  doc.moveDown(4);

  // Summary box
  const boxY = doc.y;
  doc.rect(40, boxY, doc.page.width - 80, 70).fill(COLORS.light);
  doc.fillColor(COLORS.primary).fontSize(12).font("Helvetica-Bold")
    .text("Total Fee: Rs. " + fee.totalAmount.toLocaleString("en-IN"), 60, boxY + 12);
  doc.fillColor(COLORS.success).fontSize(12)
    .text("Amount Paid: Rs. " + fee.paidAmount.toLocaleString("en-IN"), 60, boxY + 30);
  const balance = fee.totalAmount - fee.paidAmount;
  doc.fillColor(balance > 0 ? COLORS.danger : COLORS.primary).fontSize(12)
    .text("Balance Due: Rs. " + balance.toLocaleString("en-IN"), 60, boxY + 48);

  doc.moveDown(8);
  doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
    .text("This is a computer-generated receipt. No signature required.", { align: "center" });

  doc.end();
};

// Generate marksheet PDF
exports.generateMarksheet = (marks, stream) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(stream);

  drawHeader(doc, "MARKS STATEMENT");

  const student = marks.student;
  const userName = student && student.userId ? student.userId.name : "Student";

  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text("Student Details", 40, doc.y + 10);
  drawLine(doc);

  const y1 = doc.y;
  field(doc, "Student Name", userName, 40, y1);
  field(doc, "Roll No", student ? student.rollNo : "", 300, y1);
  doc.moveDown(4);

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

  const passColor = marks.grade === "F" ? COLORS.danger : COLORS.success;
  const passText = marks.grade === "F" ? "FAIL" : "PASS";
  const badgeX = doc.page.width - 120;
  doc.rect(badgeX, boxY + 15, 80, 40).fill(marks.grade === "F" ? "#fef2f2" : "#f0fdf4");
  doc.fillColor(passColor).fontSize(16).font("Helvetica-Bold")
    .text(passText, badgeX, boxY + 26, { width: 80, align: "center" });

  doc.moveDown(8);
  doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
    .text("This is a computer-generated marksheet.", { align: "center" });

  doc.end();
};
