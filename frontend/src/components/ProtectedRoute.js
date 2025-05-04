import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated =
    localStorage.getItem("isAdminAuthenticated") === "true";
  return isAuthenticated ? children : <Navigate to="/adminlogin" />;
};

export default ProtectedRoute;
