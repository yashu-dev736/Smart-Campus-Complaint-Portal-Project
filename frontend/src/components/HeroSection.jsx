import React from "react";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-overlay"></div>

      <div className="hero-content">

        <p className="hero-small-title">
          SMART CAMPUS MANAGEMENT SYSTEM
        </p>

        <h1>
          REPORT.
          <br />
          TRACK.
          <br />
          <span>RESOLVE.</span>
        </h1>

        <p className="hero-description">
          A smarter and transparent way to report, track and resolve
          campus-related complaints.
        </p>

        <div className="hero-buttons">
          <Link to="/login" className="red-button">
            RAISE A COMPLAINT
          </Link>

          <a href="#how-it-works" className="outline-button">
            HOW IT WORKS
          </a>
        </div>

      </div>

      <div className="hero-bottom-info">
        <div>
          <strong>01</strong>
          <span>Easy Complaint Submission</span>
        </div>

        <div>
          <strong>02</strong>
          <span>Transparent Tracking</span>
        </div>

        <div>
          <strong>03</strong>
          <span>Faster Resolution</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;