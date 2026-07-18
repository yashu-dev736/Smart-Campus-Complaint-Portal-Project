import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ComplaintCard from "../components/ComplaintCard.jsx";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    const [complaintsRes, statsRes] = await Promise.all([
      api.get("/complaints", { params }),
      api.get("/complaints/stats/summary"),
    ]);
    setComplaints(complaintsRes.data);
    setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <span className="eyebrow">Admin Desk</span>
          <h2>Campus-wide complaint overview</h2>
        </div>
      </div>

      {stats && (
        <div className="stat-row">
          <div className="stat-card gold">
            <div className="num">{stats.total}</div>
            <div className="label">Total</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.pending}</div>
            <div className="label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.inProgress}</div>
            <div className="label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.resolved}</div>
            <div className="label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.rejected}</div>
            <div className="label">Rejected</div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {["Hostel", "IT/WiFi", "Electrical", "Plumbing", "Canteen", "Academics", "Library", "Transport", "Other"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state panel">
          <h3>No complaints match this filter</h3>
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

export default AdminDashboard;
