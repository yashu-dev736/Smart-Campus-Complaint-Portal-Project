import React from "react";
import { Link } from "react-router-dom";

function CTASection() {
  return (
    <section className="cta-section" id="contact">
      <div className="cta-container">

        <div>
          <span>NEED TO REPORT AN ISSUE?</span>

          <h2>
            HAVE A CAMPUS
            <br />
            ISSUE?
          </h2>

          <p>
            Report it today and help us build a better,
            smarter and more responsive campus.
          </p>
        </div>

        <div className="cta-buttons">
          <Link to="/login" className="cta-white-button">
            RAISE A COMPLAINT
          </Link>

          <Link to="/login" className="cta-outline-button">
            LOGIN TO PORTAL
          </Link>
        </div>

      </div>
    </section>
  );
}

export default CTASection;