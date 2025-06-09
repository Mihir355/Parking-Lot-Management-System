const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const Ticket = require("../models/TicketModel");
const mongoose = require("mongoose");
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
      token, // token is unique
    });

    await newTicket.save();

    // Generate QR code with token
    const qrCodeDataURL = await QRCode.toDataURL(token);

    // Send email with QR
    await sendMail({
      to: email,
      subject: "Your Parking Ticket QR Code",
      html: `
        <h2>Parking Ticket Confirmed</h2>
        <p>Vehicle Type: ${vehicleType}</p>
        <p>Lot ID: ${lotId}</p>
        <p>Please present this QR code at the gate:</p>
        <img src="${qrCodeDataURL}" alt="QR Code" />
      `,
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
