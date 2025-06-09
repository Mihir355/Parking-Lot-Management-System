const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: null, // Timer only starts after QR scan
  },
  email: {
    type: String,
    required: true,
  },
  lotId: {
    type: String,
    required: true,
  },
  endTime: {
    type: Date,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
