const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    reportedBy:   { type: String, required: true }, // empId
    incidentType: {
      type: String,
      enum: ["Injury","Near Miss","Unsafe Condition","Property Damage","Other"],
      required: true,
    },
    description:     { type: String, required: true },
    photo:           { type: String, default: null },
    severity:        { type: String, enum: ["Low","Medium","High","Critical"], default: "Medium" },
    adminNote:       { type: String, default: null },
    status:          { type: String, enum: ["Open","Under Review","Resolved"], default: "Open" },
  },
  { timestamps: true }
);

const noticeSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    createdBy:   { type: String, default: "admin" },
    targetAll:   { type: Boolean, default: true },
    projectIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  Incident: mongoose.model("Incident", incidentSchema),
  Notice:   mongoose.model("Notice", noticeSchema),
};
