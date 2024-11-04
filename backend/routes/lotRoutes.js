const express = require("express");
const LotModel = require("../models/LotModel");
const router = express.Router();

router.put("/:id", async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    const updatedLot = await LotModel.findOneAndUpdate(
      { lotId: req.params.id },
      { availabilityStatus },
      { new: true }
    );

    if (!updatedLot) {
      return res.status(404).json({ message: "Lot not found" });
    }

    res.json(updatedLot);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
