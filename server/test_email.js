require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const test = async () => {
    console.log('Testing email configuration...');
    console.log('User:', process.env.EMAIL_USER);
    try {
        // We won't actually send to avoid spamming the user, 
        // but we'll check if the transporter can be created
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.verify();
        console.log('✅ Email configuration is valid!');
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
    }
    process.exit();
};

test();
