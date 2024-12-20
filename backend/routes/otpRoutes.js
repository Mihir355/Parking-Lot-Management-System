const express = require("express");
const router = express.Router();
const dotenv = require("dotenv").config();
const TicketModel = require("../models/TicketModel");
const LotModel = require("../models/LotModel");
const PriceModel = require("../models/PriceModel");
const nodemailer = require("nodemailer");
const otpStore = {};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

router.post("/send-otp", async (req, res) => {
  const { email, lotId } = req.body;

  try {
    const user = await TicketModel.findOne({
      email,
      lotId,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Parking Lot Checkout OTP",
      text: `Your OTP for checkout is ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    otpStore[`${email}_${lotId}`] = otp;

    res.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, lotId, otp } = req.body;

  const storedOtp = otpStore[`${email}_${lotId}`];
  if (storedOtp !== otp.toString()) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  const ticket = await TicketModel.findOne({
    email,
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

  delete otpStore[`${email}_${lotId}`];
  return res.json({
    success: true,
    message: "OTP verified successfully.",
    totalCost,
  });
});

module.exports = router;
