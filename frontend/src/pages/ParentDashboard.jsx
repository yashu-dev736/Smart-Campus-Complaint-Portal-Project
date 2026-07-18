import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ComplaintCard from "../components/ComplaintCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/complaints", { params: statusFilter ? { status: statusFilter } : {} });
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const counts = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <span className="eyebrow">Parent Desk</span>
          <h2>Welcome back, {user.name.split(" ")[0]}</h2>
        </div>
        <Link to="/new" className="btn btn-gold">
          + New Complaint
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat-card gold">
          <div className="num">{counts.total}</div>
          <div className="label">Total filed</div>
        </div>
        <div className="stat-card">
          <div className="num">{counts.pending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="num">{counts.inProgress}</div>
          <div className="label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="num">{counts.resolved}</div>
          <div className="label">Resolved</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p>Loading your tickets...</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state panel">
          <h3>No complaints yet</h3>
          <p>File your first ticket and we'll route it to the right department.</p>
          <Link to="/new" className="btn btn-primary" style={{ marginTop: 12 }}>
            File a complaint
          </Link>
        </div>
      ) : (
        <div className="ticket-list">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
