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

  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // Step 1: Try to reserve the slot (atomic check)
    const lot = await LotModel.findOneAndUpdate(
      { lotId: lotId, availabilityStatus: "available" },
      { $set: { availabilityStatus: "occupied" } },
      { new: true, session },
    );

    if (!lot) {
      // await session.abortTransaction();
      // session.endSession();

      return res.status(400).json({
        success: false,
        message: "Slot already booked by another user.",
      });
    }

    // Step 2: Generate token
    const token = crypto.randomBytes(16).toString("hex");

    // Step 3: Create ticket
    const newTicket = new Ticket({
      vehicleType,
      email,
      lotId,
      token,
    });

    await newTicket.save({ session });

    // Step 4: Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Step 5: QR + Email (outside transaction)
    const qrCodeDataURL = await QRCode.toDataURL(token);
    const base64Data = qrCodeDataURL.split(",")[1];
    const qrBuffer = Buffer.from(base64Data, "base64");

    let emailSent = true;

    try {
      await sendMail({
        to: email,
        subject: "Your Parking Ticket QR Code",
        html: `<h2>Parking Ticket Confirmed</h2>`,
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

    // Step 6: Emit real-time update
    io.emit("slotBooked", { lotId, vehicleType });

    return res.json({
      success: true,
      message: emailSent
        ? "Booking confirmed, QR sent."
        : "Booking confirmed, email failed.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Booking failed.",
    });
  }
});

module.exports = router;
