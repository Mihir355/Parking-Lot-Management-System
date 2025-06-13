const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const Ticket = require("../models/TicketModel");
const crypto = require("crypto");
const QRCode = require("qrcode");
const sendMail = require("../utils/sendMail");

// Fetch available slots
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

// Book a slot and emit real-time update
router.post("/book-slot", async (req, res) => {
  const { vehicleType, email, lotId } = req.body;
  const io = req.app.get("socketio"); // Access Socket.IO instance

  try {
    // Generate a unique token
    const token = crypto.randomBytes(16).toString("hex");

    // Create the ticket
    const newTicket = new Ticket({
      vehicleType,
      email,
      lotId,
      token,
    });
    await newTicket.save();

    // Mark the lot as booked (optional: check if lot is already booked first)
    await LotModel.findOneAndUpdate(
      { lotId: lotId },
      { $set: { availabilityStatus: "occupied" } }
    );

    // Generate QR code as a buffer
    const qrCodeDataURL = await QRCode.toDataURL(token);
    const base64Data = qrCodeDataURL.split(",")[1];
    const qrBuffer = Buffer.from(base64Data, "base64");

    // Send email with QR code
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
          cid: "qrcode",
        },
      ],
    });

    // ✅ Emit socket event to notify all connected clients
    io.emit("slotBooked", { lotId, vehicleType });

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
