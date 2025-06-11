// routes/cashfreeRoutes.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const BASE_URL = process.env.CASHFREE_BASE_URL;

router.post("/create-order", async (req, res) => {
  const { orderId, orderAmount, customerName, customerEmail, customerPhone } =
    req.body;

  // ✅ Sanitize customer_id to remove invalid characters
  const sanitizedCustomerId = customerEmail.replace(/[^a-zA-Z0-9_-]/g, "_");

  try {
    const response = await axios.post(
      `${BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: sanitizedCustomerId,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone, // ✅ required by Cashfree
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2025-01-01",
          "x-client-id": APP_ID,
          "x-client-secret": SECRET_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error creating Cashfree order:",
      error.response ? JSON.stringify(error.response.data) : error.message
    );
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

module.exports = router;
