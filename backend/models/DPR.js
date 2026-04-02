const mongoose = require("mongoose");

const dprSchema = new mongoose.Schema(
  {
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    date:         { type: String, required: true }, // YYYY-MM-DD
    submittedBy:  { type: String, required: true }, // empId
    workCategory: {
      type: String,
      enum: ["Excavation","Brickwork","Plaster","RCC","Finishing","Electrical","Plumbing","Other"],
      required: true,
    },
    description:      { type: String, required: true },
    skilledLabour:    { type: Number, default: 0 },
    unskilledLabour:  { type: Number, default: 0 },
    totalLabour:      { type: Number, default: 0 },
    weather: {
      type: String,
      enum: ["Sunny","Cloudy","Rain","Extreme Heat","Foggy"],
      default: "Sunny",
    },
    photos:       [{ type: String }], // file paths
    adminComment: { type: String, default: null },
    commentedBy:  { type: String, default: null },
  },
  { timestamps: true }
);

// Ek project pe ek din mein sirf ek DPR
dprSchema.index({ projectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DPR", dprSchema);
