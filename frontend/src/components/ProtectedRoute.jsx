import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Convert role to lowercase
  const userRole = user.role?.toLowerCase();

  // Check role permission
  if (
    allowedRoles &&
    !allowedRoles.includes(userRole)
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
