import React from "react";

const stats = [
  ["24/7", "COMPLAINT ACCESS"],
  ["3", "USER ROLES"],
  ["100%", "CENTRALIZED"],
  ["1", "SMART PLATFORM"]
];

function StatsSection() {
  return (
    <section className="stats-section">
      <div className="stats-container">

        <div className="stats-heading">
          <span>SMART CAMPUS</span>
          <h2>AT A GLANCE</h2>
        </div>

        <div className="stats-grid">
          {stats.map(([number, label]) => (
            <div className="stat-item" key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default StatsSection;