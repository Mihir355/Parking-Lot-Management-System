const express = require("express");
const router = express.Router();
const Ticket = require("../models/TicketModel");

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Ticket.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
});

module.exports = router;
