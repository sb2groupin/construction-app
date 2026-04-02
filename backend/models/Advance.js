const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema(
  {
    employeeId:    { type: String, required: true },
    employeeName:  { type: String, default: null },
    amount:        { type: Number, required: true, min: 1 },
    reason:        { type: String, default: null },
    requestDate:   { type: String, default: () => new Date().toISOString().split("T")[0] },
    status:        { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" },
    adminNote:     { type: String, default: null },
    // Repayment tracking
    recoveredAmount:   { type: Number, default: 0 },
    remainingAmount:   { type: Number, default: 0 },
    isFullyRecovered:  { type: Boolean, default: false },
    // Monthly deduction — kitna per month katega
    monthlyDeduction:  { type: Number, default: 0 },
    approvedBy:    { type: String, default: null },
    approvedAt:    { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advance", advanceSchema);
