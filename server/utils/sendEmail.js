let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (error) {
    nodemailer = null;
    console.error('⚠️ Nodemailer not found. Email features (like Forgot Password) will not work.');
}

const sendEmail = async (options) => {
    if (!nodemailer) {
        console.warn('❌ Cannot send email: Nodemailer is not installed.');
        return;
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // e.g. Gmail
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Define email options
    const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
        // html: options.html
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
