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

// Book a slot
router.post("/book-slot", async (req, res) => {
  const { vehicleType, email, lotId } = req.body;
  const io = req.app.get("socketio");

  try {
    // ✅ Step 1: Try to reserve slot atomically
    const updatedLot = await LotModel.findOneAndUpdate(
      { lotId: lotId, availabilityStatus: "available" }, // IMPORTANT
      { $set: { availabilityStatus: "occupied" } },
      { new: true },
    );

    // ❌ If no slot found → already booked
    if (!updatedLot) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked. Please select another.",
      });
    }

    // ✅ Step 2: Generate token
    const token = crypto.randomBytes(16).toString("hex");

    // ✅ Step 3: Create ticket ONLY after slot is reserved
    const newTicket = new Ticket({
      vehicleType,
      email,
      lotId,
      token,
    });

    await newTicket.save();

    // ✅ Step 4: Generate QR
    const qrCodeDataURL = await QRCode.toDataURL(token);
    const base64Data = qrCodeDataURL.split(",")[1];
    const qrBuffer = Buffer.from(base64Data, "base64");

    let emailSent = true;

    try {
      await sendMail({
        to: email,
        subject: "Your Parking Ticket QR Code",
        html: `
          <h2>Parking Ticket Confirmed</h2>
          <p><strong>Vehicle Type:</strong> ${vehicleType}</p>
          <p><strong>Lot ID:</strong> ${lotId}</p>
          <p>Please present this QR code at the gate:</p>
        `,
        attachments: [
          {
            filename: "qrcode.png",
            content: qrBuffer,
          },
        ],
      });
    } catch (err) {
      emailSent = false;
    }

    // ✅ Step 5: Emit real-time update
    io.emit("slotBooked", { lotId, vehicleType });

    return res.json({
      success: true,
      message: emailSent
        ? "Booking confirmed, QR sent to email."
        : "Booking confirmed, but email failed.",
    });
  } catch (error) {
    console.error("❌ Booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Booking failed.",
    });
  }
});

module.exports = router;
