const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`MongoDB unavailable: ${err.message}`);
    console.warn("Backend is running, but database-backed routes require MongoDB.");
  }
};

module.exports = connectDB;
