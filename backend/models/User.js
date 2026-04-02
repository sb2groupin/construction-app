const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true },
    role:         { type: String, enum: ["admin","employee"], default: "employee" },
    employeeId:   { type: String, default: null },
    refreshToken: { type: String, default: null },
    isActive:     { type: Boolean, default: true },
    // Profile
    name:         { type: String, default: null },
    phone:        { type: String, default: null },
    email:        { type: String, default: null },
    photo:        { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);
