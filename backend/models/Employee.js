const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    empId:       { type: String, unique: true, required: true },
    name:        { type: String, required: true, trim: true },
    phone:       { type: String, trim: true, default: null },
    email:       { type: String, trim: true, default: null },
    photo:       { type: String, default: null },        // Cloudinary URL
    // Salary
    salaryType:  { type: String, enum: ["daily","monthly"], default: "daily" },
    dailyWage:   { type: Number, default: 0 },
    monthlySalary: { type: Number, default: 0 },
    overtimeRate:  { type: Number, default: null },     // null = use company setting
    incentive:     { type: Number, default: 0 },        // monthly bonus
    // Personal
    designation: { type: String, default: "Worker" },
    alternatePhone: { type: String, trim: true, default: null },
    address:     { type: String, default: null },
    emergencyContact: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, trim: true, default: null },
    bloodGroup: { type: String, trim: true, default: null },
    maritalStatus: { type: String, trim: true, default: null },
    joinDate:    { type: Date, default: Date.now },
    // Documents
    aadharPhoto: { type: String, default: null },
    panPhoto:    { type: String, default: null },
    // Leave balance
    leaveBalance: {
      sick:    { type: Number, default: 12 },
      casual:  { type: Number, default: 12 },
      earned:  { type: Number, default: 15 },
    },
    // Relations
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
