import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ParentDashboard from "./pages/ParentDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NewComplaint from "./pages/NewComplaint.jsx";
import ComplaintDetail from "./pages/ComplaintDetail.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const dashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/parent";
};

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? dashboardPath(user.role) : "/login"} replace />;
};

const App = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute allowedRoles={["parent", "staff", "admin"]}>
                <NewComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={["parent", "staff", "admin"]}>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
