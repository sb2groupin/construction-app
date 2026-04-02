const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, default: 1 },
  unit:        { type: String, default: "Nos" },
  rate:        { type: Number, required: true },
  amount:      { type: Number }, // quantity × rate (auto)
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true }, // QT-2024-001
    clientName:      { type: String, required: true },
    clientPhone:     { type: String, default: null },
    clientEmail:     { type: String, default: null },
    clientAddress:   { type: String, default: null },
    siteName:        { type: String, default: null },
    projectId:       { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    date:            { type: Date, default: Date.now },
    validityDate:    { type: Date, default: null },
    lineItems:       [lineItemSchema],
    subtotal:        { type: Number, default: 0 },
    gstPercent:      { type: Number, default: 18 },
    gstAmount:       { type: Number, default: 0 },
    totalAmount:     { type: Number, default: 0 },
    termsConditions: { type: String, default: "1. Payment to be made within 30 days of invoice.\n2. Material cost extra unless specified.\n3. Prices valid for 30 days from quotation date." },
    status:          { type: String, enum: ["Draft","Sent","Accepted","Rejected"], default: "Draft" },
    notes:           { type: String, default: null },
    createdBy:       { type: String, default: "admin" },
  },
  { timestamps: true }
);

const agreementSchema = new mongoose.Schema(
  {
    agreementNumber:  { type: String, unique: true }, // AGR-2024-001
    quotationId:      { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", default: null },
    projectId:        { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    clientName:       { type: String, required: true },
    clientPhone:      { type: String, default: null },
    clientAddress:    { type: String, default: null },
    contractorName:   { type: String, default: null },
    projectScope:     { type: String, required: true },
    startDate:        { type: Date, default: null },
    endDate:          { type: Date, default: null },
    totalAmount:      { type: Number, default: 0 },
    paymentTerms:     { type: String, default: null },
    penaltyClause:    { type: String, default: null },
    termsConditions:  { type: String, default: null },
    clientSignName:   { type: String, default: null }, // digital acceptance
    clientSignDate:   { type: Date,   default: null },
    status:           { type: String, enum: ["Draft","Active","Completed","Terminated"], default: "Draft" },
    createdBy:        { type: String, default: "admin" },
  },
  { timestamps: true }
);

// Auto-generate quotation number
quotationSchema.pre("save", async function (next) {
  if (!this.quotationNumber) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model("Quotation").countDocuments();
    this.quotationNumber = `QT-${year}-${String(count + 1).padStart(3, "0")}`;
  }
  // Auto-calculate amounts
  this.subtotal    = this.lineItems.reduce((s, i) => s + (i.quantity * i.rate), 0);
  this.gstAmount   = parseFloat((this.subtotal * this.gstPercent / 100).toFixed(2));
  this.totalAmount = parseFloat((this.subtotal + this.gstAmount).toFixed(2));
  this.lineItems   = this.lineItems.map(i => ({ ...i.toObject(), amount: parseFloat((i.quantity * i.rate).toFixed(2)) }));
  next();
});

agreementSchema.pre("save", async function (next) {
  if (!this.agreementNumber) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model("Agreement").countDocuments();
    this.agreementNumber = `AGR-${year}-${String(count + 1).padStart(3, "0")}`;
  }
  next();
});

module.exports = {
  Quotation: mongoose.model("Quotation", quotationSchema),
  Agreement: mongoose.model("Agreement", agreementSchema),
};
