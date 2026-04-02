const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    projectId:       { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    assignedTo:      { type: String, required: true }, // empId
    assignedBy:      { type: String, default: "admin" },
    title:           { type: String, required: true },
    description:     { type: String, default: null },
    priority:        { type: String, enum: ["High","Medium","Low"], default: "Medium" },
    dueDate:         { type: String, default: null }, // YYYY-MM-DD
    status:          { type: String, enum: ["Pending","In Progress","Completed"], default: "Pending" },
    completionPhoto: { type: String, default: null },
    completedAt:     { type: Date, default: null },
    isRecurring:     { type: Boolean, default: false },
    recurringType:   { type: String, enum: ["Daily","Weekly","None"], default: "None" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
