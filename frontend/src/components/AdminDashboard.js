import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QrReader from "react-qr-reader";
import "../styling/admindashboard.css";

const AdminDashboard = () => {
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedOption, setSelectedOption] = useState("home");
  const [vehicleType, setVehicleType] = useState("");
  const [slotCount, setSlotCount] = useState("");
  const [prices, setPrices] = useState([]);
  const [updatedPrices, setUpdatedPrices] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState("");
  const [qrStatus, setQrStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slotsResponse = await axios.get(
          "https://parking-lot-management-system-xf6h.onrender.com/api/admin/available-slots"
        );
        setAvailableSlots(slotsResponse.data);

        const pricesResponse = await axios.get(
          "https://parking-lot-management-system-xf6h.onrender.com/api/admin/prices"
        );
        setPrices(pricesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert(
          "Error loading data. Please check your network or try again later."
        );
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    alert("You have been logged out.");
    navigate("/adminlogin");
  };

  const handleAddSlots = async () => {
    try {
      const response = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/admin/add-slots",
        {
          vehicleType,
          slotCount: parseInt(slotCount),
        }
      );
      setAvailableSlots(response.data.updatedSlots);
      alert("Slots added successfully!");
      setVehicleType("");
      setSlotCount("");
    } catch (error) {
      console.error("Error adding slots:", error);
      alert("Failed to add slots. Please try again.");
    }
  };

  const handleUpdatePrices = async () => {
    try {
      const response = await axios.put(
        "https://parking-lot-management-system-xf6h.onrender.com/api/admin/update-prices",
        updatedPrices
      );
      setPrices(response.data.updatedPrices);
      alert("Prices updated successfully!");
    } catch (error) {
      console.error("Error updating prices:", error);
      alert("Failed to update prices. Please try again.");
    }
  };

  const handleQRScan = async (token) => {
    if (token && token !== qrScanResult) {
      setQrScanResult(token);
      setQrStatus("Verifying QR...");

      try {
        const response = await axios.post(
          "https://parking-lot-management-system-xf6h.onrender.com/api/admin/verify-qr",
          { token }
        );

        if (response.data.success) {
          setQrStatus("✅ QR Verified. Parking session started.");
        } else {
          setQrStatus(`❌ Verification failed: ${response.data.message}`);
        }
      } catch (err) {
        console.error("QR Verification Error:", err);
        setQrStatus("❌ Error verifying QR code.");
      }
    }
  };

  const handleQRError = (err) => {
    console.error("QR Reader Error:", err);
    setQrStatus("❌ Could not access camera.");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="admin-dashboard-container">
      <nav className="navbar">
        <h2>Admin Panel</h2>
        <button className="navbar-toggle" onClick={toggleMenu}>
          ☰
        </button>
        <ul className={isMenuOpen ? "show" : ""}>
          <li onClick={() => setSelectedOption("home")}>Home</li>
          <li onClick={() => setSelectedOption("add-slots")}>Add Slots</li>
          <li onClick={() => setSelectedOption("change-rates")}>
            Change Rates
          </li>
          <li onClick={() => setSelectedOption("scan-qr")}>Scan QR</li>
          <li>
            <button onClick={handleLogout} className="logout-button">
              Log Out
            </button>
          </li>
        </ul>
      </nav>

      <div className="content">
        {selectedOption === "home" && (
          <>
            <h2>Hello Admin!</h2>
            <h3>Available Slots</h3>
            <ul>
              {Object.entries(availableSlots).map(([vehicleType, count]) => (
                <li key={vehicleType}>
                  {vehicleType}: {count} slots available
                </li>
              ))}
            </ul>
          </>
        )}

        {selectedOption === "add-slots" && (
          <div className="add-slots-form">
            <h2>Add Slots</h2>
            <label>
              Vehicle Type:
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="">Select a vehicle type</option>
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Motorbike">Motorbike</option>
                <option value="Truck">Truck</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </label>
            <label>
              Number of Slots to Add:
              <input
                type="number"
                value={slotCount}
                onChange={(e) => setSlotCount(e.target.value)}
              />
            </label>
            <button
              onClick={handleAddSlots}
              disabled={!vehicleType || !slotCount}
            >
              Add Slots
            </button>
          </div>
        )}

        {selectedOption === "change-rates" && (
          <div className="change-rates-form">
            <h2>Change Rates</h2>
            <ul>
              {prices.map((price) => (
                <li key={price.vehicleType}>
                  {price.vehicleType}: Current Price: ${price.price}
                  <input
                    type="number"
                    placeholder="New Price"
                    onChange={(e) =>
                      setUpdatedPrices((prev) => ({
                        ...prev,
                        [price.vehicleType]: e.target.value,
                      }))
                    }
                  />
                </li>
              ))}
            </ul>
            <button onClick={handleUpdatePrices}>Update Prices</button>
          </div>
        )}

        {selectedOption === "scan-qr" && (
          <div className="qr-scanner-section">
            <h2>Scan User QR Code</h2>
            <QrReader
              delay={300}
              onError={handleQRError}
              onScan={handleQRScan}
              style={{ width: "300px", margin: "0 auto" }}
            />
            <p>
              <strong>Status:</strong> {qrStatus}
            </p>
            {qrScanResult && (
              <p>
                <strong>Scanned Token:</strong> <code>{qrScanResult}</code>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
