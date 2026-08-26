// ============================================================
// utils/emailSender.js
// Sends emails (e.g. password reset links) through SMTP using
// nodemailer. Login details come from the .env file.
// ============================================================
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
  // Create the mail connection to the SMTP server from env settings
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `EduCore SMS <${process.env.EMAIL_FROM || "noreply@educore.edu"}>`,
    to,
    subject,
    html,
    // Fallback plain-text version: strip HTML tags so any mail client can read it
    text: text || html.replace(/<[^>]*>/g, "")
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`); // log for debugging
  return info;
};

module.exports = sendEmail;
