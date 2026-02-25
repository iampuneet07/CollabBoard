const mongoose = require('mongoose');

// Removed manual DNS override for Render compatibility


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process strictly if it's a minor error, 
    // but Render needs a successful start for health check.
    process.exit(1);
  }
};

module.exports = connectDB;
