import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ComplaintCard from "../components/ComplaintCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const StaffDashboard = () => {
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

  const assignedToMe = complaints.filter((c) => c.assignedTo?._id === user._id);
  const unassigned = complaints.filter((c) => !c.assignedTo);

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <span className="eyebrow">Staff Desk &middot; {user.department}</span>
          <h2>Your work queue</h2>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card gold">
          <div className="num">{assignedToMe.length}</div>
          <div className="label">Assigned to me</div>
        </div>
        <div className="stat-card">
          <div className="num">{unassigned.length}</div>
          <div className="label">Unassigned</div>
        </div>
        <div className="stat-card">
          <div className="num">{complaints.filter((c) => c.status === "Resolved").length}</div>
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
        <p>Loading queue...</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state panel">
          <h3>Queue is empty</h3>
          <p>Nothing assigned or unassigned right now. Nice work.</p>
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

export default StaffDashboard;
