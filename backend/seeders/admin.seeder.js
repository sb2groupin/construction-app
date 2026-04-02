// Admin seeder — ek baar run karo: npm run seed
// Pehle .env file mein MONGO_URI set karo
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected ✅");

    const existing = await User.findOne({ username: "admin" });
    if (existing) {
      console.log("⚠️  Admin already exists — seeder skipped");
      process.exit(0);
    }

    await User.create({
      username: "admin",
      password: "Admin@1234",   // ← change this after first login!
      role: "admin",
    });

    console.log("✅ Admin created successfully!");
    console.log("   Username: admin");
    console.log("   Password: Admin@1234");
    console.log("   ⚠️  Please change the password after first login!\n");

  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seed();
