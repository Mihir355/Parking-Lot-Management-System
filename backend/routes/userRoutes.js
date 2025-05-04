const express = require("express");
const router = express.Router();
const LotModel = require("../models/LotModel");
const Ticket = require("../models/TicketModel");
const mongoose = require("mongoose");
const { client: redisClient } = require("../middleware/redisClient");

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
  const { lotId, email } = req.body;

  const lockKey = `lock:lot:${lotId}`;
  const lockTimeout = 30000; // 30 seconds

  // Try to acquire lock
  try {
    const isLocked = await redisClient.set(lockKey, "locked", {
      NX: true, // Set only if not exists
      PX: lockTimeout, // Auto expire
    });

    if (!isLocked) {
      return res.status(423).json({
        error: "Slot is currently being booked by another user.",
      });
    }

    // Proceed with booking using transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const activeTicket = await Ticket.findOne({
        email,
        endTime: { $exists: false },
      });

      if (activeTicket) {
        await session.abortTransaction();
        await redisClient.del(lockKey);
        session.endSession();
        return res.status(400).json({
          error:
            "You already have an active booking. Please check out before booking a new slot.",
        });
      }

      const lot = await LotModel.findOneAndUpdate(
        { lotId, availabilityStatus: "available" },
        { availabilityStatus: "occupied" },
        { new: true, session }
      );

      if (!lot) {
        await session.abortTransaction();
        await redisClient.del(lockKey);
        session.endSession();
        return res
          .status(404)
          .json({ error: "Lot already booked or not found." });
      }

      const ticket = new Ticket({
        vehicleType: lot.vehicleType,
        email,
        lotId,
      });

      await ticket.save({ session });
      await session.commitTransaction();
      session.endSession();

      await redisClient.del(lockKey); // Release the lock
      res.status(200).json({ message: "Slot booked successfully", ticket });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      await redisClient.del(lockKey);
      console.error("Error booking slot:", error);
      res.status(500).json({ error: "Failed to book slot." });
    }
  } catch (error) {
    console.error("Redis locking error:", error);
    res.status(500).json({ error: "Server error during locking mechanism." });
  }
});

module.exports = router;
