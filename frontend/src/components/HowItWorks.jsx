import React from "react";

const steps = [
  ["01", "SUBMIT COMPLAINT", "Raise a complaint with the required details."],
  ["02", "REVIEW", "The complaint is reviewed by the responsible team."],
  ["03", "ASSIGN", "The issue is assigned to the appropriate staff member."],
  ["04", "TAKE ACTION", "Staff investigates and takes necessary action."],
  ["05", "UPDATE", "Complaint status and progress are updated."],
  ["06", "RESOLVE", "The complaint is resolved and closed."]
];

function HowItWorks() {
  return (
    <section className="process-section section-padding" id="how-it-works">
      <div className="section-container">

        <div className="section-heading center">
          <span>HOW IT WORKS</span>

          <h2>
            FROM COMPLAINT
            <br />
            TO RESOLUTION
          </h2>

          <div className="heading-line"></div>
        </div>

        <div className="process-grid">
          {steps.map(([number, title, text]) => (
            <div className="process-card" key={number}>

              <span className="process-number">
                {number}
              </span>

              <h3>{title}</h3>

              <p>{text}</p>

            </div>
          ))}
        </div>

        <div className="process-flow">
          <span>SUBMIT</span>
          <b>→</b>
          <span>REVIEW</span>
          <b>→</b>
          <span>ACTION</span>
          <b>→</b>
          <span>UPDATE</span>
          <b>→</b>
          <span>RESOLVE</span>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;