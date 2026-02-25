require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI ? 'FOUND' : 'NOT FOUND');

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
})
    .then(() => {
        console.log('✅ Connected successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
