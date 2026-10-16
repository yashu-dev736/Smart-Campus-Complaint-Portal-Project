import React from "react";

const features = [
  {
    number: "01",
    title: "EASY COMPLAINT SUBMISSION",
    text: "Submit campus-related complaints through a simple and structured process."
  },
  {
    number: "02",
    title: "COMPLAINT TRACKING",
    text: "Track complaint progress from submission to final resolution."
  },
  {
    number: "03",
    title: "ROLE-BASED ACCESS",
    text: "Dedicated access and dashboards for Parent, Staff and Admin."
  },
  {
    number: "04",
    title: "STATUS UPDATES",
    text: "Stay informed about complaint progress and status changes."
  },
  {
    number: "05",
    title: "COMMUNICATION",
    text: "Allow users and staff to communicate through complaint comments."
  },
  {
    number: "06",
    title: "CENTRALIZED MANAGEMENT",
    text: "Manage campus complaints through one organized digital platform."
  }
];

function FeaturesSection() {
  return (
    <section className="features-section section-padding" id="features">
      <div className="section-container">

        <div className="section-heading center">
          <span>OUR FEATURES</span>

          <h2>
            EVERYTHING NEEDED FOR
            <br />
            BETTER COMPLAINT MANAGEMENT
          </h2>

          <div className="heading-line"></div>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.number}>

              <div className="feature-top">
                <span>{feature.number}</span>
                <span className="feature-arrow">↗</span>
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.text}</p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default FeaturesSection;