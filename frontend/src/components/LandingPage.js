import React, { useState } from "react";
import "../styling/landingpage.css";
import axios from "axios";

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await axios.post(
          "https://your-api.com/api/auth/login",
          { email, password }
        );
        alert("Login successful!");
        console.log(response.data);
      } else {
        const response = await axios.post(
          "https://your-api.com/api/auth/signup",
          { name, email, password }
        );
        alert("Signup successful! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="homepage-container auth-mode">
      <div className="auth-box">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
