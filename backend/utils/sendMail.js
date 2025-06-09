const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Parking System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
