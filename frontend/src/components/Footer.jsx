import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">

      <div className="footer-container">

        <div className="footer-brand">
          <div className="footer-logo">
            <span>SC</span>
            <div>
              <strong>SMART CAMPUS</strong>
              <small>COMPLAINT PORTAL</small>
            </div>
          </div>

          <p>
            A smarter and transparent platform for
            managing campus complaints.
          </p>
        </div>

        <div className="footer-column">
          <h4>PLATFORM</h4>

          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#roles">Roles</a>
        </div>

        <div className="footer-column">
          <h4>PORTAL</h4>

          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Parent</Link>
          <Link to="/login">Staff</Link>
        </div>

        <div className="footer-column">
          <h4>CONTACT</h4>

          <span>Smart Campus Portal</span>
          <span>Andhra Pradesh, India</span>
          <span>support@smartcampus.edu</span>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Smart Campus Complaint Portal.
          All Rights Reserved.
        </p>

        <p>
          Designed for a Smarter Campus
        </p>
      </div>

    </footer>
  );
}

export default Footer;