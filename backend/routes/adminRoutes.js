const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const PriceModel = require("../models/PriceModel");
const Ticket = require("../models/TicketModel");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
dotenv.config();

router.post("/verify-qr", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await Ticket.findOne({ token });
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    if (ticket.startTime) {
      return res
        .status(400)
        .json({ success: false, message: "Ticket already used" });
    }

    // Start timer
    ticket.startTime = new Date();
    await ticket.save();

    // Update lot status to "occupied"
    await LotModel.findOneAndUpdate(
      { lotId: ticket.lotId },
      { availabilityStatus: "occupied" }
    );

    // Normalize and find user
    const user = await User.findOne({
      email: ticket.email.toLowerCase().trim(),
    });

    // Add ticket to user’s bookings
    if (user) {
      const isAlreadyBooked = user.bookings.some(
        (bookingId) => bookingId.toString() === ticket._id.toString()
      );

      if (!isAlreadyBooked) {
        user.bookings.push(ticket._id);
        await user.save();
      }
    }

    return res.json({
      success: true,
      message: "QR verified, timer started, and lot marked as occupied.",
    });
  } catch (err) {
    console.error("QR verification error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.REACT_APP_ADMIN_USERNAME &&
    password === process.env.REACT_APP_ADMIN_PASSWORD
  ) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

router.get("/available-slots", async (req, res) => {
  try {
    const availableSlots = await LotModel.aggregate([
      { $match: { availabilityStatus: "available" } },
      { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
    ]);

    const slotsCount = availableSlots.reduce((acc, slot) => {
      acc[slot._id] = slot.count;
      return acc;
    }, {});

    res.json(slotsCount);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching available slots" });
  }
});

router.post("/add-slots", async (req, res) => {
  const { vehicleType, slotCount } = req.body;

  try {
    const existingSlots = await LotModel.find({ vehicleType });
    const highestSlotID =
      existingSlots.length > 0
        ? Math.max(
            ...existingSlots.map((slot) => parseInt(slot.lotId.slice(1)))
          )
        : 0;

    const newSlots = [];
    for (let i = 1; i <= slotCount; i++) {
      const newSlotID = `${vehicleType.charAt(0).toUpperCase()}${
        highestSlotID + i
      }`;
      newSlots.push({
        vehicleType,
        lotId: newSlotID,
        availabilityStatus: "available",
      });
    }

    await LotModel.insertMany(newSlots);

    const updatedSlots = await LotModel.aggregate([
      { $match: { availabilityStatus: "available" } },
      { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
    ]);

    const slotsCount = updatedSlots.reduce((acc, slot) => {
      acc[slot._id] = slot.count;
      return acc;
    }, {});

    res.json({ success: true, updatedSlots: slotsCount });
  } catch (error) {
    console.error("Error adding slots:", error);
    res.status(500).json({ success: false, message: "Error adding slots" });
  }
});

router.get("/prices", async (req, res) => {
  try {
    const prices = await PriceModel.find({});
    res.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ success: false, message: "Error fetching prices" });
  }
});

router.put("/update-prices", async (req, res) => {
  try {
    const updatedPrices = req.body;

    for (const [vehicleType, price] of Object.entries(updatedPrices)) {
      await PriceModel.findOneAndUpdate(
        { vehicleType },
        { price },
        { new: true, upsert: true }
      );
    }

    const prices = await PriceModel.find({});
    res.json({ success: true, updatedPrices: prices });
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).json({ success: false, message: "Error updating prices" });
  }
});

module.exports = router;
