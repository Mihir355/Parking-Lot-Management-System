const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const user = await User.findById(userId)
      .populate({
        path: "bookings",
        options: {
          sort: { startTime: -1 }, // latest first
          skip,
          limit,
        },
      })
      .exec();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const totalBookings = await User.findById(userId)
      .populate("bookings")
      .then((user) => user.bookings.length);

    const bookingsWithStatus = user.bookings.map((booking) => ({
      _id: booking._id,
      lotId: booking.lotId,
      vehicleType: booking.vehicleType,
      startTime: booking.startTime,
      status: booking.endTime ? "Checked Out" : "In Use",
    }));

    res.json({
      success: true,
      bookings: bookingsWithStatus,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
    });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
});

module.exports = router;
