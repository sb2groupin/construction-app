const mongoose = require("mongoose");
const { getMongoUri } = require("./env");

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("MongoDB URI missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
};

module.exports = connectDB;
