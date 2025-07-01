const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: null,
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

// Indexes
ticketSchema.index({ token: 1 }, { unique: true }); // for fast checkout lookup
ticketSchema.index({ email: 1, lotId: 1, endTime: 1 }); // for active ticket query

module.exports = mongoose.model("Ticket", ticketSchema);
