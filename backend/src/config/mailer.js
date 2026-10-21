const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendPasswordEmail = async (toEmail, fullName, password, batchTitle) => {
  await transporter.sendMail({
    from: `"JSS Coaching" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your JSS batch access — ${batchTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Welcome to JSS, ${fullName}!</h2>
        <p>Your payment for <strong>${batchTitle}</strong> was successful. Here are your login details:</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 4px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please log in and change your password from your profile page.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block; background:#f97316; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; margin-top:8px;">Login now</a>
      </div>
    `,
  });
};

module.exports = { sendPasswordEmail };