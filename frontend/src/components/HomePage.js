import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/homepage.css";
import axios from "axios";

const Homepage = () => {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [lotId, setLotId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [activeTab, setActiveTab] = useState("book");
  const [history, setHistory] = useState([]);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    if (activeTab === "history") {
      fetchBookingHistory();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const fetchBookingHistory = async () => {
    try {
      const res = await axios.get(
        `https://parking-lot-management-system-xf6h.onrender.com/api/bookings/user/${userId}`
      );
      setHistory(res.data.bookings || []);
    } catch (err) {
      console.error("Error fetching booking history", err);
      alert("Unable to fetch booking history. Try again later.");
    }
  };

  const handleBookSubmit = async (e) => {
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

  const handleCheckout = async () => {
    try {
      await axios.put(
        `https://parking-lot-management-system-xf6h.onrender.com/api/lots/${lotId}`,
        { availabilityStatus: "available" }
      );
      alert(`Checkout successful. Paid $${totalCost.toFixed(2)}.`);
      setOtpSent(false);
      setCheckoutReady(false);
      setOtp("");
      setLotId("");
      setTotalCost(0);
    } catch (err) {
      console.error(err);
      alert("Checkout failed.");
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
                <p>Total: ${totalCost.toFixed(2)}</p>
                <button onClick={handleCheckout}>Pay & Checkout</button>
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
              <ul className="booking-list">
                {history.map((item) => (
                  <li key={item._id}>
                    Slot: {item.lotId} | Vehicle: {item.vehicleType} | Date:{" "}
                    {new Date(item.createdAt).toLocaleString()} | Status:{" "}
                    {item.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Homepage;
