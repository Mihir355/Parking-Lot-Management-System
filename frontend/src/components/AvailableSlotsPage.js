import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styling/availableslotspage.css";

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [bookingInfo, setBookingInfo] = useState({
    lotId: "",
    phoneNumber: "",
  });
  const [isBooking, setIsBooking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleType = location.state?.vehicleType;

  useEffect(() => {
    const fetchSlots = async () => {
      if (vehicleType) {
        try {
          const response = await axios.get(
            `https://parking-lot-management-system-xf6h.onrender.com/api/user/available-slots/${vehicleType}`
          );
          setSlots(response.data);
        } catch (error) {
          console.error("Error fetching slots:", error);
        }
      }
    };
    fetchSlots();
  }, [vehicleType]);

  const handleBookSlot = (lotId) => {
    setBookingInfo({ ...bookingInfo, lotId });
    setIsBooking(true);
  };

  const handlePhoneNumberChange = (e) => {
    setBookingInfo({ ...bookingInfo, phoneNumber: e.target.value });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    const { lotId, phoneNumber } = bookingInfo;

    try {
      await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/user/book-slot",
        {
          lotId,
          phoneNumber,
        }
      );
      alert(
        `Slot ${lotId} booked successfully for phone number ${phoneNumber}!`
      );
      setIsBooking(false);
      navigate("/");
    } catch (error) {
      console.error("Error booking slot:", error);
      alert("Failed to book slot. Please try again.");
    }
  };

  return (
    <div className="available-slots-container">
      <h2>Available Slots for {vehicleType}</h2>
      <ul className="slot-list">
        {slots.length > 0 ? (
          slots.map((slot) => (
            <li key={slot.lotId}>
              Lot ID: {slot.lotId} - Status: {slot.availabilityStatus}
              <button onClick={() => handleBookSlot(slot.lotId)}>Book</button>
            </li>
          ))
        ) : (
          <p>No available slots for this vehicle type.</p>
        )}
      </ul>

      {isBooking && (
        <form className="booking-form" onSubmit={handleSubmitBooking}>
          <h3>Enter your phone number to book the slot:</h3>
          <input
            type="text"
            placeholder="Phone Number"
            value={bookingInfo.phoneNumber}
            onChange={handlePhoneNumberChange}
            required
          />
          <button type="submit">Confirm Booking</button>
          <button
            type="button"
            onClick={() => setIsBooking(false)}
            className="cancel-button"
          >
            Cancel
          </button>
        </form>
      )}

      <button
        onClick={() =>
          navigate("/", { state: { activeContent: "availability" } })
        }
        className="go-back-button"
      >
        Go Back
      </button>
    </div>
  );
};

export default AvailableSlotsPage;
