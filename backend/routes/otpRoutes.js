const express = require("express");
const router = express.Router();
const dotenv = require("dotenv").config();
const TicketModel = require("../models/TicketModel");
const LotModel = require("../models/LotModel");
const PriceModel = require("../models/PriceModel");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const otpStore = {};

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.post("/complete-checkout", async (req, res) => {
  const { email, lotId } = req.body;
  const key = `${email}_${lotId}`;
  const otpEntry = otpStore[key];

  if (!otpEntry || otpEntry.used || Date.now() > otpEntry.expiresAt) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP session." });
  }

  try {
    const ticket = await TicketModel.findOne({
      email,
      lotId,
      endTime: { $exists: false },
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Active ticket not found." });
    }

    ticket.endTime = new Date();
    await ticket.save();

    await LotModel.findOneAndUpdate(
      { lotId: lotId },
      { $set: { availabilityStatus: "available" } }
    );

    otpEntry.used = true;
    return res.json({ success: true, message: "Checkout completed." });
  } catch (error) {
    console.error("Error completing checkout:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during checkout." });
  }
});

router.post("/send-otp", otpLimiter, async (req, res) => {
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

    otpStore[`${email}_${lotId}`] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
    };

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
  const key = `${email}_${lotId}`;
  const otpEntry = otpStore[key];

  if (!otpEntry) {
    return res.status(400).json({ success: false, message: "No OTP found." });
  }

  if (otpEntry.used) {
    return res
      .status(400)
      .json({ success: false, message: "OTP has already been used." });
  }

  if (Date.now() > otpEntry.expiresAt) {
    delete otpStore[key];
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired." });
  }

  if (otpEntry.otp !== otp.toString()) {
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
  const now = new Date();
  const durationInHours = Math.ceil((now - startTime) / (1000 * 60 * 60));
  const totalCost = durationInHours * price.price;

  return res.json({
    success: true,
    message: "OTP verified successfully.",
    totalCost,
  });
});

module.exports = router;
