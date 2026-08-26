// ============================================================
// utils/excelGenerator.js
// Builds the students Excel (.xlsx) report with ExcelJS and
// streams it straight into the HTTP response.
// ============================================================
const ExcelJS = require("exceljs");

exports.generateExcelReport = async (students, stream) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduCore SMS";
  workbook.created = new Date();

  // One sheet named "Students"; fitToPage makes it print nicely
  const ws = workbook.addWorksheet("Students", { pageSetup: { fitToPage: true } });

  // Header style
  const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00236F" } };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

  // Column definitions also set header text + column width
  ws.columns = [
    { header: "Roll No", key: "rollNo", width: 14 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Department", key: "department", width: 25 },
    { header: "Semester", key: "semester", width: 12 },
    { header: "Admission Year", key: "admissionYear", width: 16 },
    { header: "Status", key: "status", width: 12 }
  ];

  // Style row 1 (the headers): navy fill, white bold, centered
  ws.getRow(1).eachCell(cell => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(1).height = 24;

  // Add one spreadsheet row per student; ?. guards against missing user data
  students.forEach(s => {
    ws.addRow({
      rollNo: s.rollNo,
      name: s.userId?.name || "",
      email: s.userId?.email || "",
      phone: s.userId?.phone || "",
      department: s.department,
      semester: s.semester,
      admissionYear: s.admissionYear,
      status: s.status
    });
  });

  // Alternate row coloring
  // Zebra stripes (light blue / white) make rows easier to read
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNumber % 2 === 0 ? "FFF0F4FF" : "FFFFFFFF" } };
        cell.alignment = { vertical: "middle" };
      });
    }
  });

  // Write the finished file into the response stream
  await workbook.xlsx.write(stream);
};
