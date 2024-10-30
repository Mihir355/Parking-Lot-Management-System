const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  phoneNumber: {
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
});

module.exports = mongoose.model("Ticket", ticketSchema);
