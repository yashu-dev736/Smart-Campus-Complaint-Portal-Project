import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

const statuses = ["Pending", "In Progress", "Resolved", "Rejected"];

const formatDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(`/complaints/${id}`);
    setComplaint(data);
    setNewStatus(data.status);
  }, [id]);

  useEffect(() => {
    load().catch(() => setError("Unable to load this complaint"));
  }, [load]);

  useEffect(() => {
    if (user.role === "admin") {
      api.get("/users", { params: { role: "staff" } }).then(({ data }) => setStaffList(data));
    }
  }, [user.role]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.put(`/complaints/${id}/status`, { status: newStatus, note });
      setComplaint(data);
      setNote("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTo) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.put(`/complaints/${id}/assign`, { staffId: assignTo });
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign complaint");
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/complaints/${id}/comments`, { message: comment });
      setComplaint(data);
      setComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this complaint permanently?")) return;
    await api.delete(`/complaints/${id}`);
    navigate("/admin");
  };

  if (error && !complaint) {
    return (
      <div className="container">
        <div className="form-error">{error}</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container">
        <p>Loading ticket...</p>
      </div>
    );
  }

  const canManage = user.role === "admin";

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <span className="eyebrow mono">TICKET #{complaint._id.slice(-6).toUpperCase()}</span>
          <h2>{complaint.title}</h2>
        </div>
        {user.role === "admin" && (
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete ticket
          </button>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="detail-grid">
        <div>
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="ticket-meta" style={{ marginBottom: 14 }}>
              <span className="tag">{complaint.category}</span>
              <span className={`tag priority-${complaint.priority}`}>{complaint.priority} priority</span>
              {complaint.location && <span className="tag">{complaint.location}</span>}
              <span className={`tag`}>{complaint.status}</span>
            </div>
            <p style={{ lineHeight: 1.6 }}>{complaint.description}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 14 }}>
              {complaint.createdBy?.name ? (
                <>
                  Filed by <b>{complaint.createdBy.name}</b> on {formatDateTime(complaint.createdAt)}
                </>
              ) : (
                <>Filed on {formatDateTime(complaint.createdAt)}</>
              )}
              {complaint.assignedTo && (
                <>
                  {" "}
                  &middot; Assigned to <b>{complaint.assignedTo.name}</b>
                </>
              )}
            </p>
            {user.role === "admin" && complaint.contactEmail && (
              <p style={{ fontSize: "0.82rem", marginTop: 6 }}>
                <span className="tag" style={{ background: "var(--pending-bg)", color: "var(--pending)" }}>
                  Admin only
                </span>{" "}
                Contact email: <b>{complaint.contactEmail}</b>
              </p>
            )}
          </div>

          <div className="panel">
            <h3>Discussion</h3>
            {complaint.comments.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>No comments yet.</p>
            )}
            {complaint.comments.map((c) => (
              <div className="comment" key={c._id}>
                <div className="comment-head">
                  {c.authorName} <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>&middot; {c.authorRole}</span>
                </div>
                <div style={{ fontSize: "0.88rem" }}>{c.message}</div>
              </div>
            ))}
            <form onSubmit={handleComment} style={{ marginTop: 12 }}>
              <div className="field">
                <textarea
                  rows={3}
                  placeholder="Add a comment or update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <button className="btn btn-ghost btn-sm" disabled={busy}>
                Post comment
              </button>
            </form>
          </div>
        </div>

        <div>
          {canManage && (
            <div className="panel" style={{ marginBottom: 20 }}>
              <h3>Update status</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="field">
                  <label>Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Note (emailed to parent)</label>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-block btn-sm" disabled={busy}>
                  Update status
                </button>
              </form>
            </div>
          )}

          {user.role === "admin" && (
            <div className="panel" style={{ marginBottom: 20 }}>
              <h3>Assign staff</h3>
              <form onSubmit={handleAssign}>
                <div className="field">
                  <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                    <option value="">Select staff member</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-gold btn-block btn-sm" disabled={busy}>
                  Assign
                </button>
              </form>
            </div>
          )}

          <div className="panel">
            <h3>History</h3>
            {complaint.history
              .slice()
              .reverse()
              .map((h, idx) => (
                <div className="history-item" key={idx}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{h.status}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                    {h.changedByName} &middot; {formatDateTime(h.createdAt)}
                  </div>
                  {h.note && <div style={{ fontSize: "0.82rem", marginTop: 2 }}>{h.note}</div>}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;