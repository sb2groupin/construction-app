const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name zaroori hai"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location zaroori hai"],
      trim: true,
    },
    googleMapLink: {
      type: String,
      default: null,
    },
    // Geo-fencing ke liye — Phase 4 mein use hoga
    siteLatitude: {
      type: Number,
      default: null,
    },
    siteLongitude: {
      type: Number,
      default: null,
    },
    geoFenceRadius: {
      type: Number,
      default: 500, // meters
    },
    clientName: {
      type: String,
      trim: true,
      default: null,
    },
    clientPhone: {
      type: String,
      default: null,
    },
    budget: {
      type: Number,
      default: 0,
    },
    amountSpent: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "On Hold", "Completed", "Cancelled"],
      default: "Active",
    },
    completionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Site supervisor — Employee ka empId
    supervisorId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
