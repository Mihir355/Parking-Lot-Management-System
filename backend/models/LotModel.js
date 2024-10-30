const mongoose = require("mongoose");

const LotSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    enum: ["Car", "SUV", "Motorbike", "Bicycle", "Truck"],
  },
  lotId: {
    type: String,
    required: true,
    unique: true,
  },
  availabilityStatus: {
    type: String,
    required: true,
    enum: ["available", "occupied"],
    default: "available",
  },
});

LotSchema.index({ vehicleType: 1, lotId: 1 });

module.exports = mongoose.model("Lot", LotSchema);
