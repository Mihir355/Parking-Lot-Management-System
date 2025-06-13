import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "../styling/availableslotspage.css";

// Connect to Socket.IO server
const socket = io("https://parking-lot-management-system-xf6h.onrender.com");

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const vehicleType = location.state?.vehicleType;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !vehicleType) {
      navigate("/"); // Redirect if not logged in or vehicleType is missing
    }
  }, [navigate, vehicleType]);

  // Fetch available slots
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

  // Handle booking
  const handleBookSlot = async (lotId) => {
    const email = localStorage.getItem("userEmail");

    if (!email) {
      alert("Email not found. Please log in again.");
      navigate("/");
      return;
    }

    const confirmBooking = window.confirm(
      `Do you want to book Lot ${lotId} using your registered email (${email})?`
    );

    if (confirmBooking) {
      try {
        await axios.post(
          "https://parking-lot-management-system-xf6h.onrender.com/api/user/book-slot",
          {
            lotId,
            email,
            vehicleType,
          }
        );
        alert(`Slot ${lotId} booked successfully for ${email}!`);
        navigate("/home");
      } catch (error) {
        console.error("Error booking slot:", error);
        alert("Failed to book slot. Please try again.");
      }
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
