const express = require("express");
const router = express.Router();
const dotenv = require("dotenv").config();
const TicketModel = require("../models/TicketModel");
const LotModel = require("../models/LotModel");
const PriceModel = require("../models/PriceModel");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const otpStore = {};

router.post("/send-otp", async (req, res) => {
  const { phoneNumber, lotId } = req.body;

  try {
    const user = await TicketModel.findOne({
      phoneNumber,
      lotId,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await client.messages.create({
      body: `Your OTP for checkout is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    otpStore[`${phoneNumber}_${lotId}`] = otp;

    res.json({ success: true, message: "OTP sent to your phone number." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { phoneNumber, lotId, otp } = req.body;

  const storedOtp = otpStore[`${phoneNumber}_${lotId}`];
  if (storedOtp !== otp.toString()) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  const ticket = await TicketModel.findOne({
    phoneNumber,
    lotId,
    endTime: { $exists: false },
  });

  if (!ticket) {
    return res
      .status(404)
      .json({ success: false, message: "Ticket not found." });
  }

  const price = await PriceModel.findOne({ vehicleType: ticket.vehicleType });
  if (!price) {
    return res
      .status(404)
      .json({ success: false, message: "Price not found for vehicle type." });
  }

  const startTime = ticket.startTime;
  const endTime = new Date();
  ticket.endTime = endTime;
  const durationInHours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
  const totalCost = durationInHours * price.price;

  await LotModel.updateOne({ lotId }, { availabilityStatus: "available" });

  await ticket.save();

  delete otpStore[`${phoneNumber}_${lotId}`];
  console.log(totalCost);
  return res.json({
    success: true,
    message: "OTP verified successfully.",
    totalCost,
  });
});

module.exports = router;
