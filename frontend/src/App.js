import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loader from "./components/Loader";

// Lazy imports
const Homepage = lazy(() => import("./components/HomePage"));
const AdminLoginPage = lazy(() => import("./components/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const AvailableSlotsPage = lazy(() =>
  import("./components/AvailableSlotsPage")
);
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const LandingPage = lazy(() => import("./components/LandingPage"));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Homepage />} />
          <Route path="/adminlogin" element={<AdminLoginPage />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/available-slots" element={<AvailableSlotsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
