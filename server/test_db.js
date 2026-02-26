require('dotenv').config();
const mongoose = require('mongoose');
console.log('Testing MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('Connected!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed:', err.message);
        process.exit(1);
    });
