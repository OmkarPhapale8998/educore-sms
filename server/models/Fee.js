const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ["cash", "online", "cheque", "DD"], default: "cash" },
  receiptNo: { type: String, unique: true, sparse: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes: String
});

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  feeBreakdown: {
    tuition: { type: Number, default: 0 },
    lab: { type: Number, default: 0 },
    library: { type: Number, default: 0 },
    sports: { type: Number, default: 0 },
    misc: { type: Number, default: 0 }
  },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["paid", "pending", "partial", "overdue"],
    default: "pending"
  },
  paymentHistory: [paymentSchema]
}, { timestamps: true });

// Auto-compute status before save
feeSchema.pre("save", function (next) {
  this.paidAmount = this.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partial";
  } else if (new Date() > this.dueDate) {
    this.status = "overdue";
  } else {
    this.status = "pending";
  }
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
