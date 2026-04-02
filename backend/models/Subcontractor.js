const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  date:      { type: String },
  note:      { type: String, default: null },
  receiptPhoto: { type: String, default: null },
}, { timestamps: true });

const subcontractorSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    trade:       { type: String, default: "General" }, // Plumber, Electrician, Mason, Carpenter, Waterproofing, Painting, Other
    phone:       { type: String, default: null },
    company:     { type: String, default: null },
    email:       { type: String, default: null },
    address:     { type: String, default: null },
    // Work assignment
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    workScope:   { type: String, default: null },
    contractAmount: { type: Number, default: 0 },
    startDate:   { type: String, default: null },
    endDate:     { type: String, default: null },
    status:      { type: String, enum: ["Active","Completed","On Hold","Terminated"], default: "Active" },
    // Payments
    payments:    [paymentSchema],
    totalPaid:   { type: Number, default: 0 },
    balanceDue:  { type: Number, default: 0 },
    // Documents
    agreementDoc: { type: String, default: null },
    invoiceDoc:   { type: String, default: null },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subcontractor", subcontractorSchema);
