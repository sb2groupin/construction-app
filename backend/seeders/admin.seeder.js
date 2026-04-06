const mongoose = require("mongoose");
const User = require("../models/User");
const { getMongoUri } = require("../config/env");

const seed = async () => {
  try {
   
    const dbURI = getMongoUri();
    if (!dbURI) throw new Error("MongoDB URI missing. Set MONGO_URI or MONGODB_URI in your environment.");
    
    await mongoose.connect(dbURI);
    console.log("DB Connected ✅");

    const existing = await User.findOne({ username: "admin" });
    if (existing) {
      console.log("⚠️  Admin already exists — seeder skipped");
      process.exit(0);
    }

    await User.create({
      username: "admin",
      password: "Admin@1234",
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
