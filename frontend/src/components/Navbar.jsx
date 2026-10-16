import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, setUser, setToken } = useAuth();

  // Initialize theme from localStorage
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  // Apply theme globally and save it
  useEffect(() => {
    const applyTheme = (selectedTheme) => {
      document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
      );

      document.documentElement.style.colorScheme = selectedTheme;

      localStorage.setItem("theme", selectedTheme);
    };

    applyTheme(theme);

    // Notify components that listen for theme changes
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme },
      })
    );
  }, [theme]);

  // Toggle between Light and Dark Mode
  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "light" ? "dark" : "light"
    );
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear authentication state without clearing the theme
    setUser(null);
    setToken(null);

    navigate("/login", { replace: true });
  };

  // Normalize user role
  const role = user?.role?.toLowerCase();

  // Get dashboard path based on role
  const getDashboardPath = () => {
    switch (role) {
      case "admin":
        return "/admin-dashboard";

      case "staff":
        return "/staff-dashboard";

      case "parent":
        return "/parent-dashboard";

      default:
        return "/";
    }
  };

  // Check active navigation link
  const isActive = (path) => location.pathname === path;

  // Navigation link styles
  const navLinkStyle = (path) => ({
    textDecoration: "none",
    color: isActive(path) ? "#ffffff" : "var(--navbar-link-color)",
    background: isActive(path)
      ? "var(--navbar-active-bg)"
      : "transparent",
    padding: "9px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    transition: "background 0.2s ease, color 0.2s ease",
    whiteSpace: "nowrap",
  });

  return (
    <nav className="portal-navbar">
      {/* BRAND */}
      <div
        className="portal-brand"
        onClick={() => navigate(getDashboardPath())}
        role="button"
        tabIndex={0}
        aria-label="Go to dashboard"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(getDashboardPath());
          }
        }}
      >
        <div className="portal-brand-logo">SC</div>

        <div>
          <div className="portal-brand-title">Smart Campus</div>

          <div className="portal-brand-subtitle">
            COMPLAINT PORTAL
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="portal-nav-links">
        <Link
          to={getDashboardPath()}
          style={navLinkStyle(getDashboardPath())}
          aria-current={
            isActive(getDashboardPath()) ? "page" : undefined
          }
        >
          Dashboard
        </Link>

        <Link
          to="/new-complaint"
          style={navLinkStyle("/new-complaint")}
          aria-current={
            isActive("/new-complaint") ? "page" : undefined
          }
        >
          New Complaint
        </Link>
      </div>

      {/* USER SECTION */}
      <div className="portal-user-section">
        {/* THEME TOGGLE */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            theme === "light" ? "dark" : "light"
          } mode`}
          aria-pressed={theme === "dark"}
          title={`Switch to ${
            theme === "light" ? "dark" : "light"
          } mode`}
        >
          <span aria-hidden="true">
            {theme === "light" ? "🌙" : "☀️"}
          </span>

          <span className="theme-toggle-label">
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </button>

        {/* USER INFORMATION */}
        <div className="portal-user-info">
          <div className="portal-user-name">
            {user?.fullName || user?.name || "User"}
          </div>

          <div className="portal-user-role">
            {role
              ? role.charAt(0).toUpperCase() + role.slice(1)
              : "User"}
          </div>
        </div>

        {/* AVATAR */}
        <div className="portal-user-avatar" aria-hidden="true">
          {(
            user?.fullName ||
            user?.name ||
            "U"
          )
            .trim()
            .charAt(0)
            .toUpperCase()}
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="portal-logout-button"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;