import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

const categories = ["Hostel", "IT/WiFi", "Electrical", "Plumbing", "Canteen", "Academics", "Library", "Transport", "Other"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const NewComplaint = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    location: "",
    priority: "Medium",
    contactEmail: user?.email || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/complaints", form);
      navigate(`/complaints/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="panel">
        <span className="eyebrow">File a new ticket</span>
        <h2>Submit a complaint</h2>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              name="title"
              placeholder="e.g. WiFi not working in Block C"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              name="description"
              rows={5}
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Location</label>
            <input
              name="location"
              placeholder="e.g. Hostel Block C, Room 204"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input
              type="email"
              name="contactEmail"
              placeholder="you@example.com"
              value={form.contactEmail}
              onChange={handleChange}
              required
            />
            <p style={{ fontSize: "0.76rem", color: "var(--ink-soft)", marginTop: 6 }}>
              Only visible to Admins — Staff and other Parents won't see this address.
            </p>
          </div>
          <button className="btn btn-gold btn-block" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit complaint"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
