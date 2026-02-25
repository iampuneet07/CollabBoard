const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to resolve MongoDB Atlas SRV records
// (fixes ECONNREFUSED or hangs on some ISPs/networks)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set DNS servers, using default.');
}


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
