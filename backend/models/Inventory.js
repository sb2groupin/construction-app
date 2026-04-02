const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    projectId:         { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    materialName:      { type: String, required: true, trim: true },
    unit:              { type: String, required: true }, // bags, MT, CFT, pieces, litre
    currentStock:      { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 50 },
    vendorName:        { type: String, default: null },
    unitPrice:         { type: Number, default: 0 },
    totalValue:        { type: Number, default: 0 }, // currentStock * unitPrice
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    inventoryId:  { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    type:         { type: String, enum: ["received", "used"], required: true },
    quantity:     { type: Number, required: true },
    billPhoto:    { type: String, default: null },
    notes:        { type: String, default: null },
    recordedBy:   { type: String }, // empId
  },
  { timestamps: true }
);

const materialRequestSchema = new mongoose.Schema(
  {
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    requestedBy:  { type: String, required: true }, // empId
    materialName: { type: String, required: true },
    quantity:     { type: Number, required: true },
    unit:         { type: String, required: true },
    reason:       { type: String },
    status:       { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" },
    adminNote:    { type: String, default: null },
    reviewedBy:   { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = {
  Inventory:       mongoose.model("Inventory", inventorySchema),
  Transaction:     mongoose.model("Transaction", transactionSchema),
  MaterialRequest: mongoose.model("MaterialRequest", materialRequestSchema),
};
