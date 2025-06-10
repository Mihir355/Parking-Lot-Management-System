const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate("bookings").exec();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const bookingsWithStatus = user.bookings.map((booking) => ({
      _id: booking._id,
      lotId: booking.lotId,
      vehicleType: booking.vehicleType,
      startTime: booking.startTime,
      status: booking.endTime ? "Checked Out" : "In Use",
    }));

    res.json({ success: true, bookings: bookingsWithStatus });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
});
