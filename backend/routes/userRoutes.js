const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const Ticket = require("../models/TicketModel");
const mongoose = require("mongoose");

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
  const { lotId, phoneNumber } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lot = await LotModel.findOneAndUpdate(
      { lotId, availabilityStatus: "available" },
      { availabilityStatus: "occupied" },
      { new: true, session }
    );

    if (!lot) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ error: "Lot already booked or not found." });
    }

    const ticket = new Ticket({
      vehicleType: lot.vehicleType,
      phoneNumber,
      lotId,
    });
    await ticket.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Slot booked successfully", ticket });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Failed to book slot." });
  }
});

module.exports = router;
