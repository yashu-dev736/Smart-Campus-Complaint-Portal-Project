import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import NewComplaint from "./pages/NewComplaint";

function App() {
  const location = useLocation();

  const isPublicPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="app-container">
      {!isPublicPage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/new-complaint"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff", "parent"]}
            >
              <NewComplaint />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;