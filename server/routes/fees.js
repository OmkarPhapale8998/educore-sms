const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const { generateFeeReceipt } = require("../utils/pdfGenerator");
const crypto = require("crypto");

router.use(protect);

// GET all fees
router.get("/", authorize("admin", "faculty", "student"), async (req, res, next) => {
  try {
    const { status, semester, department, search, page = 1, limit = 20 } = req.query;
    let studentFilter = {};
    if (department) studentFilter.department = department;
    if (semester) studentFilter.semester = parseInt(semester);

    let studentIds = (await Student.find(studentFilter).select("_id")).map(s => s._id);
    if (search) {
      const searchStudents = await Student.find({ rollNo: { $regex: search, $options: "i" } }).select("_id");
      studentIds = searchStudents.map(s => s._id);
    }

    const query = { student: { $in: studentIds } };
    if (status) query.status = status;

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate({ path: "student", populate: { path: "userId", select: "name email" } })
      .sort({ dueDate: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Summary stats
    const stats = await Fee.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: {
        _id: null,
        totalDue: { $sum: "$totalAmount" },
        totalCollected: { $sum: "$paidAmount" },
        pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "partial", "overdue"]] }, { $subtract: ["$totalAmount", "$paidAmount"] }, 0] } }
      }}
    ]);

    res.json({ success: true, data: fees, stats: stats[0] || {}, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET single fee record
router.get("/:id", async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({ path: "student", populate: { path: "userId", select: "name email phone" } });
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });
    res.json({ success: true, data: fee });
  } catch (err) { next(err); }
});

// POST create fee record
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const fee = await Fee.create(req.body);
    res.status(201).json({ success: true, message: "Fee record created", data: fee });
  } catch (err) { next(err); }
});

// POST collect fee payment
router.post("/:id/collect", authorize("admin"), async (req, res, next) => {
  try {
    const { amount, method, notes } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });

    const receiptNo = `RCP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    fee.paymentHistory.push({ amount: parseFloat(amount), method, notes, collectedBy: req.user._id, receiptNo });
    await fee.save(); // pre-save hook auto-updates status

    res.json({ success: true, message: "Payment recorded", data: fee, receiptNo });
  } catch (err) { next(err); }
});

// GET fee receipt as PDF
router.get("/:id/receipt/:receiptNo", async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({ path: "student", populate: { path: "userId", select: "name email phone" } });
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });

    const payment = fee.paymentHistory.find(p => p.receiptNo === req.params.receiptNo);
    if (!payment) return res.status(404).json({ success: false, message: "Receipt not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${req.params.receiptNo}.pdf`);
    generateFeeReceipt(fee, payment, res);
  } catch (err) { next(err); }
});

module.exports = router;
