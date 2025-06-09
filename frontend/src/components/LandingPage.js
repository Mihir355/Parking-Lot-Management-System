import React, { useState } from "react";
import "../styling/landingpage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && (!name || !confirmPassword))) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    try {
      if (isLogin) {
        const response = await axios.post(
          "https://parking-lot-management-system-xf6h.onrender.com/api/auth/login",
          { email, password }
        );

        const { user } = response.data;

        // Store user data in localStorage
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("userEmail", user.email);

        alert(`Welcome back, ${user.name}!`);
        navigate("/home");
      } else {
        const signupResponse = await axios.post(
          "https://parking-lot-management-system-xf6h.onrender.com/api/auth/signup",
          { name, email, password }
        );

        alert("Signup successful! Please log in with your credentials.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Authentication Error:", err);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="homepage-container auth-mode">
      <div className="auth-box">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>
        <button onClick={toggleForm} className="toggle-button">
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
