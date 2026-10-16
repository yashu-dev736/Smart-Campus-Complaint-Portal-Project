import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="home-navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link
          to="/"
          className="home-logo"
          onClick={() => setMenuOpen(false)}
        >
          <div className="logo-mark">SC</div>

          <div className="logo-text">
            <strong>SMART CAMPUS</strong>
            <span>COMPLAINT PORTAL</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={`home-nav ${menuOpen ? "open" : ""}`}>

          <a href="#home" onClick={() => setMenuOpen(false)}>
            HOME
          </a>

          <a href="#about" onClick={() => setMenuOpen(false)}>
            ABOUT
          </a>

          <a href="#features" onClick={() => setMenuOpen(false)}>
            FEATURES
          </a>

          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            HOW IT WORKS
          </a>

          <a href="#roles" onClick={() => setMenuOpen(false)}>
            ROLES
          </a>

          <a href="#contact" onClick={() => setMenuOpen(false)}>
            CONTACT
          </a>
        </nav>

        {/* Right Side */}
        <div className="navbar-actions">

        

          {/* Main Login Button */}
          <button
            type="button"
            className="navbar-login"
            onClick={handleLogin}
          >
            LOGIN
          </button>

          {/* Mobile Menu */}
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            ☰
          </button>

        </div>

      </div>
    </header>
  );
}

export default HomeNavbar;