const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    submittedBy: { type: String, required: true }, // empId
    amount:      { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: ["Labour","Material","Food","Transport","Tool","Misc"],
      required: true,
    },
    description: { type: String, required: true },
    billPhoto:   { type: String, default: null },
    status:      { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" },
    adminNote:   { type: String, default: null },
    reviewedBy:  { type: String, default: null },
    reviewedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

const pettyCashSchema = new mongoose.Schema(
  {
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    totalGiven:  { type: Number, default: 0 },
    totalSpent:  { type: Number, default: 0 },
    balance:     { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = {
  Expense:    mongoose.model("Expense", expenseSchema),
  PettyCash:  mongoose.model("PettyCash", pettyCashSchema),
};
