const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const getFirstDefinedEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getMongoUri = () => getFirstDefinedEnv("MONGODB_URI", "MONGO_URI");

module.exports = {
  envPath,
  getFirstDefinedEnv,
  getMongoUri,
};
