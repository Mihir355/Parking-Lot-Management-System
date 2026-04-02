const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  await resend.emails.send({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content.toString("base64"),
    })),
  });
};

module.exports = sendMail;
