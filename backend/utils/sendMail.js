const { Resend } = require("resend");

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  try {
    // Validate required fields
    if (!to || !subject || !html) {
      throw new Error("Missing required email fields");
    }

    // Send email via Resend
    const response = await resend.emails.send({
      // ⚠️ IMPORTANT: Use Resend's default sender OR verified domain
      from: "onboarding@resend.dev",
      to,
      subject,
      html,

      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content.toString("base64"), // Buffer → base64
      })),
    });

    console.log("✅ Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Resend email error:");

    // Detailed error logging
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message || error);
    }

    throw error; // rethrow so calling function can handle it
  }
};

module.exports = sendMail;
