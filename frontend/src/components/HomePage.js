import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styling/homepage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faSignOutAlt,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Homepage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeContent, setActiveContent] = useState(null);
  const [vehicleType, setVehicleType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lotId, setLotId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  useEffect(() => {
    if (location.state?.activeContent) {
      setActiveContent(location.state.activeContent);
    }
  }, [location.state]);

  const handleCircleClick = (type) => {
    if (type === "admin") {
      navigate("/adminlogin");
    } else {
      setActiveContent(type);
    }
  };

  const handleGoBack = () => {
    setActiveContent(null);
    setOtpSent(false);
    setTotalCost(0);
    setCheckoutComplete(false);
  };

  const handleVehicleTypeChange = (e) => {
    setVehicleType(e.target.value);
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  const handleLotIdChange = (e) => {
    setLotId(e.target.value);
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleCheckAvailability = (e) => {
    e.preventDefault();
    navigate("/available-slots", { state: { vehicleType } });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://parking-lot-management-system-backend-c28e.onrender.com/api/otp/send-otp",
        {
          phoneNumber,
          lotId,
        }
      );
      if (response.data.success) {
        alert("OTP sent to your phone number.");
        setOtpSent(true);
      } else {
        alert("Phone number and Lot ID do not match any record.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred while sending OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://parking-lot-management-system-backend-c28e.onrender.com/api/otp/verify-otp",
        {
          phoneNumber,
          lotId,
          otp,
        }
      );

      if (response.data.success) {
        console.log(response.data);
        const cost = response.data.totalCost;
        setTotalCost(cost);

        alert("OTP verified successfully. Ready to checkout.");
        setCheckoutComplete(true);
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("An error occurred while verifying OTP. Please try again.");
    }
  };

  const handleCheckout = async () => {
    try {
      await axios.put(`https://parking-lot-management-system-backend-c28e.onrender.com/api/lots/${lotId}`, {
        availabilityStatus: "available",
      });

      alert(
        `Payment of $${totalCost.toFixed(2)} successful. You are checked out.`
      );
      setActiveContent(null);
      setOtpSent(false);
      setOtp("");
      setPhoneNumber("");
      setLotId("");
      setTotalCost(0);
      setCheckoutComplete(false);
    } catch (error) {
      console.error("Error completing checkout:", error);
      alert("An error occurred during checkout. Please try again.");
    }
  };

  return (
    <div className="homepage-container">
      <div className="left-side">
        <img
          src="https://res.cloudinary.com/dkpm0glt6/image/upload/v1730013080/Drone_parking_lot_perspective__hckp2h.jpg"
          alt="Parking Lot"
          className="parking-image"
        />
      </div>
      <div className="right-side">
        <p className="main-heading">Parking Lot Management System</p>
        <div className="content-container">
          {activeContent === null ? (
            <div className="circle-container">
              <div
                className="whole-description"
                onClick={() => handleCircleClick("availability")}
              >
                <div className="circle">
                  <FontAwesomeIcon icon={faCheckCircle} size="4x" />
                </div>
                <div className="desc">
                  <h2>Check Availability</h2>
                </div>
              </div>
              <div
                className="whole-description"
                onClick={() => handleCircleClick("checkout")}
              >
                <div className="circle">
                  <FontAwesomeIcon icon={faSignOutAlt} size="4x" />
                </div>
                <div className="desc">
                  <h2>Exit & Checkout</h2>
                </div>
              </div>
              <div
                className="whole-description"
                onClick={() => handleCircleClick("admin")}
              >
                <div className="circle">
                  <FontAwesomeIcon icon={faLock} size="4x" />
                </div>
                <div className="desc">
                  <h2>Admin Login</h2>
                </div>
              </div>
            </div>
          ) : (
            <div className="active-content">
              {activeContent === "availability" && (
                <div>
                  <h2>Check Availability Form</h2>
                  <form onSubmit={handleCheckAvailability}>
                    <select
                      value={vehicleType}
                      onChange={handleVehicleTypeChange}
                      required
                    >
                      <option value="" disabled>
                        Select vehicle type
                      </option>
                      <option value="Car">Car</option>
                      <option value="Motorbike">Motorbike</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="SUV">SUV</option>
                      <option value="Truck">Truck</option>
                    </select>
                    <button type="submit">Check</button>
                  </form>
                </div>
              )}
              {activeContent === "checkout" && (
                <div>
                  <h2>Exit & Checkout - Send OTP</h2>
                  <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
                    <input
                      type="text"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Enter Lot ID"
                      value={lotId}
                      onChange={handleLotIdChange}
                      required
                    />
                    {otpSent && (
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={handleOtpChange}
                        required
                      />
                    )}
                    <button type="submit">
                      {otpSent ? "Verify OTP" : "Send OTP"}
                    </button>
                  </form>
                  {checkoutComplete && (
                    <div className="checkout-info">
                      <p className="total-cost">
                        Total Amount: ${totalCost.toFixed(2)}
                      </p>
                      <button onClick={handleCheckout}>Pay & Checkout</button>
                    </div>
                  )}
                </div>
              )}
              <button onClick={handleGoBack}>Go Back</button>
            </div>
          )}
        </div>
        <p className="site-description">
          Welcome to the Parking Lot Management System, where you can easily
          manage parking slots and optimize your parking experience.
        </p>
      </div>
    </div>
  );
};

export default Homepage;
