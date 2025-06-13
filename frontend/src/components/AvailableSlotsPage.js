import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "../styling/availableslotspage.css";

const socket = io("https://parking-lot-management-system-xf6h.onrender.com");

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ loading state
  const [bookingInfo, setBookingInfo] = useState({ lotId: "", email: "" });
  const [isBooking, setIsBooking] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleType = location.state?.vehicleType;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !vehicleType) {
      navigate("/"); // Redirect if not logged in or vehicleType is missing
    }
  }, []);

  // Fetch slots
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://parking-lot-management-system-xf6h.onrender.com/api/user/available-slots/${vehicleType}`
      );
      setSlots(response.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
      alert("Error fetching slots. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and socket setup
  useEffect(() => {
    if (vehicleType) {
      fetchSlots();

      // Listen for real-time updates
      socket.on(
        "slotBooked",
        ({ lotId: bookedId, vehicleType: bookedType }) => {
          if (bookedType === vehicleType) {
            console.log(`Slot ${bookedId} booked — refreshing slots`);
            fetchSlots();
          }
        }
      );

      return () => {
        socket.off("slotBooked");
      };
    }
  }, [vehicleType]);

  const handleBookSlot = (lotId) => {
    setBookingInfo({ ...bookingInfo, lotId });
    setIsBooking(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleEmailChange = (e) => {
    setBookingInfo({ ...bookingInfo, email: e.target.value });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    const { lotId, email } = bookingInfo;

    try {
      await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/user/book-slot",
        {
          lotId,
          email,
          vehicleType,
        }
      );
      alert(`Slot ${lotId} booked successfully for email ${email}!`);
      setIsBooking(false);
      navigate("/home");
    } catch (error) {
      console.error("Error booking slot:", error);
      alert("Failed to book slot. Please try again.");
    }
  };

  return (
    <div className="available-slots-container">
      <h2>Available Slots for {vehicleType}</h2>

      {loading ? (
        <p className="loading-message">Loading available slots...</p>
      ) : slots.length > 0 ? (
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot._id || slot.lotId}>
              Lot ID: {slot.lotId} - Status: {slot.availabilityStatus}
              <button onClick={() => handleBookSlot(slot.lotId)}>Book</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No available slots for this vehicle type.</p>
      )}

      {isBooking && (
        <form
          ref={formRef}
          className="booking-form"
          onSubmit={handleSubmitBooking}
        >
          <h3>Enter your email ID to book the lot:</h3>
          <input
            type="email"
            placeholder="Email ID"
            value={bookingInfo.email}
            onChange={handleEmailChange}
            required
          />
          <div className="booking-form-buttons">
            <button type="submit" className="booking-confirm-button">
              Confirm Booking
            </button>
            <button
              type="button"
              onClick={() => setIsBooking(false)}
              className="booking-cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <button
        onClick={() =>
          navigate("/home", { state: { activeContent: "availability" } })
        }
        className="go-back-button"
      >
        Go Back
      </button>
    </div>
  );
};

export default AvailableSlotsPage;
