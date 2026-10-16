import React, { useState } from "react";

function AboutSection() {
  const [active, setActive] = useState(0);

  const items = [
    {
      title: "OUR PURPOSE",
      text: "To provide a simple and transparent platform for reporting campus-related issues and ensuring that complaints reach the right people."
    },
    {
      title: "OUR MISSION",
      text: "To improve communication between parents, staff and administration while making complaint management faster and more efficient."
    },
    {
      title: "OUR VISION",
      text: "To create a smarter, more responsive and digitally connected campus environment."
    }
  ];

  return (
    <section className="about-section section-padding" id="about">
      <div className="section-container">

        <div className="section-heading">
          <span>ABOUT US</span>
          <h2>
            BUILDING A SMARTER
            <br />
            CAMPUS EXPERIENCE
          </h2>
          <div className="heading-line"></div>
        </div>

        <div className="about-grid">

          <div className="about-image">
            <div className="campus-placeholder">
              <div className="campus-content">
                <span>CAMPUS</span>
                <strong>SMART</strong>
                <small>CONNECTED • DIGITAL • RESPONSIVE</small>
              </div>
            </div>

            <div className="image-number">
              01
            </div>
          </div>

          <div className="about-content">

            <p className="about-label">
              SMART CAMPUS COMPLAINT PORTAL
            </p>

            <h3>
              A CENTRALIZED PLATFORM
              FOR CAMPUS COMPLAINTS
            </h3>

            <p>
              Smart Campus Complaint Portal is a centralized digital
              platform designed to make campus complaint management
              easier, faster and more transparent.
            </p>

            <p>
              Parents can submit and track complaints, staff can review
              and resolve issues, and administrators can monitor the
              overall complaint management process.
            </p>

            <div className="accordion">
              {items.map((item, index) => (
                <div className="accordion-item" key={item.title}>
                  <button
                    onClick={() =>
                      setActive(active === index ? -1 : index)
                    }
                  >
                    <span>{item.title}</span>
                    <span>{active === index ? "−" : "+"}</span>
                  </button>

                  {active === index && (
                    <div className="accordion-content">
                      {item.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;