const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const Ticket = require("../models/TicketModel");
const crypto = require("crypto");
const QRCode = require("qrcode");
const sendMail = require("../utils/sendMail");

router.get("/available-slots/:vehicleType", async (req, res) => {
  const vehicleType = req.params.vehicleType;

  try {
    const availableSlots = await LotModel.find({
      vehicleType,
      availabilityStatus: "available",
    });
    res.json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Error fetching available slots." });
  }
});

router.post("/book-slot", async (req, res) => {
  const { vehicleType, email, lotId } = req.body;

  try {
    // Generate a unique token (used in QR)
    const token = crypto.randomBytes(16).toString("hex");

    // Create the ticket
    const newTicket = new Ticket({
      vehicleType,
      email,
      lotId,
      token,
    });

    await newTicket.save();

    // Generate QR code as a Data URL
    const qrCodeDataURL = await QRCode.toDataURL(token);

    // Convert Data URL to a buffer
    const base64Data = qrCodeDataURL.split(",")[1];
    const qrBuffer = Buffer.from(base64Data, "base64");

    // Send email with QR code as inline image
    await sendMail({
      to: email,
      subject: "Your Parking Ticket QR Code",
      html: `
        <h2>Parking Ticket Confirmed</h2>
        <p><strong>Vehicle Type:</strong> ${vehicleType}</p>
        <p><strong>Lot ID:</strong> ${lotId}</p>
        <p>Please present this QR code at the gate:</p>
        <img src="cid:qrcode" alt="QR Code" />
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrBuffer,
          cid: "qrcode", // referenced in the <img src="cid:qrcode">
        },
      ],
    });

    res.json({
      success: true,
      message: "Booking confirmed, QR sent to email.",
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ success: false, message: "Booking failed." });
  }
});

module.exports = router;
