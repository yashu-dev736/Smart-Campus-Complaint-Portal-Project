import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const dashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/parent";
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to={user ? dashboardPath(user.role) : "/"} className="brand">
          <span className="brand-mark">&#9670;</span> Smart Campus Complaint Desk
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to={dashboardPath(user.role)}>Dashboard</Link>
              <Link to="/new">New Complaint</Link>
              <span className="role-chip">{user.role}</span>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
