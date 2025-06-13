import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styling/homepage.css";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";

const Homepage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicleType, setVehicleType] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [lotId, setLotId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [activeTab, setActiveTab] = useState("book");
  const [history, setHistory] = useState([]);
  const [phone, setPhone] = useState("");
  const [isCFReady, setIsCFReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const cf = await load({ mode: "sandbox" });
        window.cfInstance = cf;
        setIsCFReady(true);
      } catch (error) {
        console.error("Failed to load Cashfree SDK:", error);
        alert("Failed to initialize payment gateway.");
      }
    };

    initCashfree();
  }, []);

  // ✅ MODIFIED useEffect: Handles checkout after redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("order_id");

    if (orderId) {
      (async () => {
        try {
          const res = await axios.get(
            `https://parking-lot-management-system-xf6h.onrender.com/api/cashfree/check-order-status/${orderId}`
          );
          const realStatus = res.data.status;

          if (realStatus === "PAID") {
            alert(`✅ Payment confirmed for Order ID: ${orderId}`);

            try {
              await axios.post(
                "https://parking-lot-management-system-xf6h.onrender.com/api/otp/complete-checkout",
                { email, lotId }
              );
              alert("✅ Checkout completed!");
              setOtp("");
              setOtpSent(false);
              setCheckoutReady(false);
              setLotId("");
              setTotalCost(0);
              setPhone("");
            } catch (err) {
              console.error("Checkout completion failed:", err);
              alert("Payment was successful, but checkout failed.");
            }

            setActiveTab("history");
            fetchBookingHistory();
          } else {
            alert(`❌ Payment failed for Order ID: ${orderId}`);
          }
        } catch (err) {
          console.error("Error verifying order:", err);
          alert("⚠️ Could not verify payment. Please check history.");
        }

        // ✅ Clean the URL
        window.history.replaceState({}, document.title, "/home");
      })();
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchBookingHistory();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const fetchBookingHistory = async (page = 1) => {
    try {
      const res = await axios.get(
        `https://parking-lot-management-system-xf6h.onrender.com/api/bookings/user/${userId}?page=${page}&limit=5`
      );
      setHistory(res.data.bookings || []);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching booking history", err);
      alert("Unable to fetch booking history.");
    }
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!vehicleType) return alert("Please select a vehicle type.");
    navigate("/available-slots", { state: { vehicleType } });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/otp/send-otp",
        { email, lotId }
      );
      if (res.data.success) {
        setOtpSent(true);
        alert("OTP sent to your email.");
      } else {
        alert("Invalid email or Lot ID.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP.");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/otp/verify-otp",
        { email, lotId, otp }
      );
      if (res.data.success) {
        setTotalCost(res.data.totalCost);
        setCheckoutReady(true);
        alert("OTP verified. Ready to checkout.");
      } else {
        alert("Invalid OTP.");
      }
    } catch (err) {
      console.error(err);
      alert("OTP verification failed.");
    }
  };

  // ✅ MODIFIED: Removed checkout API from onSuccess
  const handlePayment = async () => {
    if (!lotId || !email || !phone) {
      return alert("Please enter all required fields.");
    }

    try {
      const orderId = `order_${Date.now()}`;
      const orderResponse = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/cashfree/create-order",
        {
          orderId,
          orderAmount: totalCost,
          customerName: userName || "Customer",
          customerEmail: email,
          customerPhone: phone,
        }
      );

      const { payment_session_id } = orderResponse.data;

      if (!payment_session_id) {
        return alert("Failed to get payment session ID.");
      }

      if (!window.cfInstance) {
        return alert("Cashfree SDK not loaded.");
      }

      window.cfInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
        onSuccess: () => {
          alert("✅ Payment Successful! Redirecting...");
        },
        onFailure: (err) => {
          console.error("❌ Payment Failed:", err);
          alert("❌ Payment Failed. Please try again.");
        },
        onDismiss: () => {
          alert("⚠️ Payment popup closed.");
        },
      });
    } catch (error) {
      console.error("Error in payment:", error);
      alert("Payment initiation failed.");
    }
  };

  return (
    <div className="homepage-wrapper">
      <header className="homepage-header">
        <h1>Welcome, {userName || "User"}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="homepage-tabs">
        <button
          className={activeTab === "book" ? "active" : ""}
          onClick={() => setActiveTab("book")}
        >
          Book Slot
        </button>
        <button
          className={activeTab === "checkout" ? "active" : ""}
          onClick={() => setActiveTab("checkout")}
        >
          Exit & Checkout
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          Booking History
        </button>
      </nav>

      <main className="homepage-content">
        {activeTab === "book" && (
          <form onSubmit={handleBookSubmit} className="form-section">
            <h2>Check Slot Availability</h2>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
            >
              <option value="">Select Vehicle Type</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Motorbike">Motorbike</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Truck">Truck</option>
            </select>
            <button type="submit">Check Slots</button>
          </form>
        )}

        {activeTab === "checkout" && (
          <div className="form-section">
            <h2>Exit & Checkout</h2>
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <input
                type="text"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                placeholder="Enter Lot ID"
                required
              />
              {otpSent && (
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              )}
              <button type="submit">
                {otpSent ? "Verify OTP" : "Send OTP"}
              </button>
            </form>

            {checkoutReady && (
              <div>
                <p>Total: ₹{totalCost.toFixed(2)}</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your 10-digit phone number"
                  required
                />
                {!isCFReady && <p>Loading payment gateway...</p>}
                <button
                  onClick={handlePayment}
                  disabled={
                    !isCFReady || phone.length !== 10 || !/^\d{10}$/.test(phone)
                  }
                >
                  Pay & Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-section">
            <h2>Booking History</h2>
            {history.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              <>
                <ul className="booking-list">
                  {history.map((item) => (
                    <li key={item._id}>
                      Slot: {item.lotId} | Vehicle: {item.vehicleType} | Date:{" "}
                      {new Date(item.startTime).toLocaleString()} | Status:{" "}
                      {item.status}
                    </li>
                  ))}
                </ul>
                <div className="pagination-controls">
                  <button
                    onClick={() => fetchBookingHistory(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchBookingHistory(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Homepage;
