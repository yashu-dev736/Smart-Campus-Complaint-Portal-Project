import React from "react";
import { Link } from "react-router-dom";

const shortId = (id) => id.slice(-6).toUpperCase();

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const ComplaintCard = ({ complaint }) => {
  const statusClass = `status-${complaint.status.replace(/\s+/g, "-")}`;

  return (
    <Link to={`/complaints/${complaint._id}`} className="ticket" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="ticket-main">
        <span className="ticket-id mono">TICKET #{shortId(complaint._id)}</span>
        <h3>{complaint.title}</h3>
        <p className="ticket-desc">{complaint.description}</p>
        <div className="ticket-meta">
          <span className="tag">{complaint.category}</span>
          <span className={`tag priority-${complaint.priority}`}>{complaint.priority} priority</span>
          {complaint.location && <span className="tag">{complaint.location}</span>}
          {complaint.createdBy?.name && <span className="tag">by {complaint.createdBy.name}</span>}
        </div>
      </div>
      <div className="ticket-stub">
        <div className={`stamp ${statusClass}`}>{complaint.status}</div>
        <div className="ticket-date">{formatDate(complaint.createdAt)}</div>
      </div>
    </Link>
  );
};

export default ComplaintCard;
