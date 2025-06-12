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
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `https://parking-lot-management-system-1.onrender.com/home?order_id=${orderId}&status=$%7Border_status%7D`,
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

router.get("/check-order-status/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const response = await axios.get(
      `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const status = response.data.order_status; // e.g., PAID, FAILED
    res.json({ status });
  } catch (err) {
    console.error(
      "Cashfree order check failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to check order status" });
  }
});

module.exports = router;
