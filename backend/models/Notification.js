const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId:   { type: String, required: true },   // empId ya "admin"
    recipientRole: { type: String, enum: ["admin","employee"], default: "employee" },
    type: {
      type: String,
      enum: [
        "leave_approved","leave_rejected","task_assigned","task_overdue",
        "expense_approved","expense_rejected","advance_approved","advance_rejected",
        "low_stock","flagged_attendance","quotation_accepted","quotation_rejected",
        "notice","incident_reported","material_request","salary_slip_ready"
      ],
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: null },   // frontend route
    isRead:  { type: Boolean, default: false },
    data:    { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
