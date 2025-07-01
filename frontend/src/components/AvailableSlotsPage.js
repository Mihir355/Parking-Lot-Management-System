import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "../styling/availableslotspage.css";

const socket = io("https://parking-lot-management-system-xf6h.onrender.com");

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const vehicleType = location.state?.vehicleType;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !vehicleType) {
      navigate("/");
    }
  }, [navigate, vehicleType]);

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

  const handleBookSlot = async () => {
    const email = localStorage.getItem("userEmail");

    if (!email) {
      alert("Email not found. Please log in again.");
      navigate("/");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a slot to book.");
      return;
    }

    const confirmBooking = window.confirm(
      `Do you want to book Lot ${selectedSlot} using your registered email (${email})?`
    );

    if (confirmBooking) {
      try {
        await axios.post(
          "https://parking-lot-management-system-xf6h.onrender.com/api/user/book-slot",
          {
            lotId: selectedSlot,
            email,
            vehicleType,
          }
        );
        alert(`Slot ${selectedSlot} booked successfully for ${email}!`);
        navigate("/home");
      } catch (error) {
        console.error("Error booking slot:", error);
        alert("Failed to book slot. Please try again.");
      }
    }
  };

  return (
    <div className="available-slots-container">
      <h2>Select an Available Slot for {vehicleType}</h2>

      {loading ? (
        <p className="loading-message">Loading available slots...</p>
      ) : slots.length > 0 ? (
        <div className="dropdown-container">
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="slot-dropdown"
          >
            <option value="">-- Select a Lot ID --</option>
            {slots.map((slot) => (
              <option key={slot._id || slot.lotId} value={slot.lotId}>
                Lot {slot.lotId}
              </option>
            ))}
          </select>

          <button
            onClick={handleBookSlot}
            className="booking-confirm-button"
            disabled={!selectedSlot}
          >
            Book Selected Slot
          </button>
        </div>
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
