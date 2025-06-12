// routes/lot.js
const express = require("express");
const Lot = require("../models/LotModel");
const router = express.Router();

// PATCH route to mark a lot as available
router.patch("/mark-available/:lotId", async (req, res) => {
  const { lotId } = req.params;

  try {
    const lot = await Lot.findOneAndUpdate(
      { lotId },
      { availabilityStatus: "available" },
      { new: true }
    );

    if (!lot) {
      return res.status(404).json({ success: false, message: "Lot not found" });
    }

    res.json({ success: true, message: "Lot marked as available", lot });
  } catch (error) {
    console.error("Error updating lot availability:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update lot status" });
  }
});

module.exports = router;
