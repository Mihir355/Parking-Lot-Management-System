// routes/cashfreeRoutes.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const BASE_URL = process.env.CASHFREE_BASE_URL;

router.post("/create-order", async (req, res) => {
  const { orderId, orderAmount, customerName, customerEmail } = req.body;

  try {
    const response = await axios.post(
      `${BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: customerEmail,
          customer_email: customerEmail,
          customer_name: customerName,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
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
