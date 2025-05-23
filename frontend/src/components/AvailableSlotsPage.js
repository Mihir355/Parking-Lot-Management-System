import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styling/availableslotspage.css";

const AvailableSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [bookingInfo, setBookingInfo] = useState({
    lotId: "",
    email: "",
  });
  const [isBooking, setIsBooking] = useState(false);
  const formRef = useRef(null); // ✅ Form reference for scrolling
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
          alert("Error fetching slots. Please try again later.");
        }
      }
    };
    fetchSlots();
  }, [vehicleType]);

  const handleBookSlot = (lotId) => {
    setBookingInfo({ ...bookingInfo, lotId });
    setIsBooking(true);
    // ✅ Scroll to the form after a slight delay to ensure it's rendered
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
        }
      );
      alert(`Slot ${lotId} booked successfully for email ${email}!`);
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
