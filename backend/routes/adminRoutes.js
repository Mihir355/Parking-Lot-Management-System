const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const PriceModel = require("../models/PriceModel");
const Ticket = require("../models/TicketModel");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
dotenv.config();

// ✅ Verify QR
router.post("/verify-qr", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await Ticket.findOne({ token }).lean();
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

    const updates = [
      Ticket.updateOne(
        { _id: ticket._id },
        { $set: { startTime: new Date() } }
      ),
      LotModel.updateOne(
        { lotId: ticket.lotId },
        { $set: { availabilityStatus: "occupied" } }
      ),
      User.updateOne(
        {
          email: ticket.email.toLowerCase().trim(),
          bookings: { $ne: ticket._id },
        },
        { $push: { bookings: ticket._id } }
      ),
    ];

    await Promise.all(updates);

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

// ✅ Admin login
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

// ✅ Available slot counts per vehicle type
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

// ✅ Add slots
router.post("/add-slots", async (req, res) => {
  const { vehicleType, slotCount } = req.body;

  try {
    // Only fetch lotId for computing max
    const existing = await LotModel.find({ vehicleType })
      .select("lotId")
      .lean();
    const highestSlotID =
      existing.length > 0
        ? Math.max(...existing.map((slot) => parseInt(slot.lotId.slice(1))))
        : 0;

    const newSlots = Array.from({ length: slotCount }, (_, i) => ({
      vehicleType,
      lotId: `${vehicleType.charAt(0).toUpperCase()}${highestSlotID + i + 1}`,
      availabilityStatus: "available",
    }));

    await LotModel.insertMany(newSlots);

    // Get updated counts again
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

// ✅ Get current prices
router.get("/prices", async (req, res) => {
  try {
    const prices = await PriceModel.find({}).lean();
    res.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ success: false, message: "Error fetching prices" });
  }
});

// ✅ Update prices (bulk)
router.put("/update-prices", async (req, res) => {
  try {
    const updatedPrices = req.body;

    const operations = Object.entries(updatedPrices).map(
      ([vehicleType, price]) => ({
        updateOne: {
          filter: { vehicleType },
          update: { price },
          upsert: true,
        },
      })
    );

    await PriceModel.bulkWrite(operations);

    const prices = await PriceModel.find({}).lean();
    res.json({ success: true, updatedPrices: prices });
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).json({ success: false, message: "Error updating prices" });
  }
});

module.exports = router;
