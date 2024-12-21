import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styling/adminloginpage.css";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get(
          "https://parking-lot-management-system-xf6h.onrender.com/api/admin/check-admin"
        );
        setAdminExists(response.data.exists);
      } catch (error) {
        console.error("Error checking admin existence:", error);
      }
    };

    checkAdmin();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/admin/login",
        { username, password }
      );

      if (response.data.success) {
        alert("Login successful!");
        navigate("/admin-dashboard");
      } else {
        alert("Invalid username or password.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== rePassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "https://parking-lot-management-system-xf6h.onrender.com/api/admin/signup",
        { username, password }
      );

      if (response.data.success) {
        alert("Admin account created successfully!");
        setIsSignUp(false);
        setAdminExists(true);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="admin-login-container">
      <h2>Admin {isSignUp ? "Sign-Up" : "Login"}</h2>
      {!isSignUp ? (
        <form onSubmit={handleLogin}>
          <div>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleSignUp}>
          <div>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Re-enter Password</label>
            <input
              type="password"
              value={rePassword}
              onChange={(e) => setRePassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign Up</button>
        </form>
      )}
      <button onClick={handleGoBack}>Go Back</button>
      {!adminExists && !isSignUp && (
        <p>
          Not an Admin?{" "}
          <button onClick={() => setIsSignUp(true)} className="signup-link">
            Sign Up
          </button>
        </p>
      )}
    </div>
  );
};

export default AdminLoginPage;
