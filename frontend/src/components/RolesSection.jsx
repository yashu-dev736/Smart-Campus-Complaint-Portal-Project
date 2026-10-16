import React from "react";
import { Link } from "react-router-dom";

const roles = [
  {
    number: "01",
    role: "PARENT",
    title: "RAISE & TRACK",
    description:
      "Parents can submit campus complaints and monitor their progress.",
    points: [
      "Submit complaints",
      "Track complaint status",
      "View updates",
      "Add comments",
      "Upload documents"
    ]
  },
  {
    number: "02",
    role: "STAFF",
    title: "REVIEW & RESOLVE",
    description:
      "Staff members can review relevant complaints and take action.",
    points: [
      "View assigned complaints",
      "Review details",
      "Update status",
      "Communicate",
      "Resolve complaints"
    ]
  },
  {
    number: "03",
    role: "ADMIN",
    title: "MONITOR & MANAGE",
    description:
      "Administrators can monitor and manage the overall complaint system.",
    points: [
      "Monitor complaints",
      "Manage users",
      "Manage staff",
      "View analytics",
      "Generate reports"
    ]
  }
];

function RolesSection() {
  return (
    <section className="roles-section section-padding" id="roles">
      <div className="section-container">

        <div className="section-heading center">
          <span>OUR USER ROLES</span>

          <h2>
            ONE PLATFORM.
            <br />
            THREE ROLES.
          </h2>

          <div className="heading-line"></div>
        </div>

        <div className="roles-grid">

          {roles.map((role) => (
            <div className="role-card" key={role.role}>

              <div className="role-number">
                {role.number}
              </div>

              <span className="role-label">
                {role.role}
              </span>

              <h3>{role.title}</h3>

              <p>{role.description}</p>

              <ul>
                {role.points.map((point) => (
                  <li key={point}>
                    <span>✓</span>
                    {point}
                  </li>
                ))}
              </ul>

              <Link to="/login" className="role-button">
                LOGIN →
              </Link>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}

export default RolesSection;