import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { generateComplaintPDF } from "../utils/generateComplaintPDF";

const API_URL = "http://localhost:5000/api";

const STATUS_OPTIONS = [
  "Pending",
  "In Progress",
  "Resolved",
  "Rejected",
  "Closed",
];

const FILTER_OPTIONS = ["All", ...STATUS_OPTIONS];

// =====================================================
// THEME HELPERS
// =====================================================

const getTheme = () =>
  document.documentElement.getAttribute("data-theme") || "light";

const getToken = () => localStorage.getItem("token");

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const complaintId = (item) =>
  item?.id || item?._id || item?.complaintId || "";

const statusOf = (item) => item?.status || "Pending";

const getDisplayName = (item) =>
  item?.userName ||
  item?.parentName ||
  item?.staffName ||
  item?.name ||
  item?.userEmail ||
  item?.email ||
  "Unknown User";

function toDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value?._seconds === "number") {
    return new Date(value._seconds * 1000);
  }

  if (typeof value === "object" && typeof value.seconds === "string") {
    return new Date(Number(value.seconds) * 1000);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

const formatDate = (value) => {
  const date = toDate(value);

  if (!date) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function normalizeList(data) {
  if (Array.isArray(data)) return data;

  const possibleLists = [
    data?.complaints,
    data?.data?.complaints,
    data?.results?.complaints,
    data?.results,
    data?.data,
  ];

  for (const list of possibleLists) {
    if (Array.isArray(list)) return list;
  }

  return [];
}

function statusStyle(status) {
  const dark = getTheme() === "dark";

  const styles = {
    pending: dark
      ? { background: "#422f12", color: "#fcd34d", border: "1px solid #78531b" }
      : { background: "#fff4cc", color: "#854d0e", border: "1px solid #f4d58a" },

    "in progress": dark
      ? { background: "#172e50", color: "#93c5fd", border: "1px solid #28548a" }
      : { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },

    resolved: dark
      ? { background: "#153b2b", color: "#86efac", border: "1px solid #246044" }
      : { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },

    rejected: dark
      ? { background: "#451d24", color: "#fca5a5", border: "1px solid #7f303b" }
      : { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },

    closed: dark
      ? { background: "#30343b", color: "#d1d5db", border: "1px solid #4b5563" }
      : { background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db" },
  };

  return styles[(status || "").toLowerCase()] || {
    background: "var(--surface-secondary, #f3f4f6)",
    color: "var(--text-primary, #374151)",
    border: "1px solid var(--border-color, #e5e7eb)",
  };
}

function getLocationDetails(location) {
  if (!location) {
    return { address: "", latitude: null, longitude: null };
  }

  if (typeof location === "string") {
    return { address: location, latitude: null, longitude: null };
  }

  return {
    address:
      location.address ||
      location.formattedAddress ||
      location.description ||
      location.placeName ||
      "",
    latitude:
      location.latitude ??
      location.lat ??
      location._latitude ??
      null,
    longitude:
      location.longitude ??
      location.lng ??
      location._longitude ??
      null,
  };
}

function getMapsUrl(location) {
  const details = getLocationDetails(location);

  if (
    details.latitude !== null &&
    details.longitude !== null
  ) {
    return `https://www.google.com/maps?q=${encodeURIComponent(
      `${details.latitude},${details.longitude}`
    )}`;
  }

  if (details.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      details.address
    )}`;
  }

  return "";
}

function getComments(complaint) {
  if (Array.isArray(complaint?.comments)) {
    return complaint.comments;
  }

  if (Array.isArray(complaint?.history)) {
    return complaint.history;
  }

  return [];
}

// =====================================================
// STAFF DASHBOARD
// =====================================================

export default function StaffDashboard() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [newStatus, setNewStatus] = useState("Pending");
  const [statusReason, setStatusReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // -----------------------------------------------------
  // FETCH COMPLAINTS
  // -----------------------------------------------------

  const fetchComplaints = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setRefreshing(true);

      setError("");

      const response = await axios.get(
        `${API_URL}/complaints`,
        authConfig()
      );

      const list = normalizeList(response.data);

      setComplaints(list);

      setSelected((previous) => {
        if (!previous) return previous;

        const id = complaintId(previous);

        return (
          list.find((item) => complaintId(item) === id) ||
          previous
        );
      });
    } catch (err) {
      console.error("Error fetching complaints:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load complaints. Please check your connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();

    const timer = window.setInterval(() => {
      fetchComplaints();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchComplaints]);

  // -----------------------------------------------------
  // CATEGORY OPTIONS
  // -----------------------------------------------------

  const categories = useMemo(() => {
    const values = complaints
      .map((item) => item.category)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [complaints]);

  // -----------------------------------------------------
  // SEARCH AND FILTER
  // -----------------------------------------------------

  const filtered = useMemo(() => {
    let list = [...complaints];

    if (statusFilter !== "All") {
      list = list.filter(
        (item) =>
          statusOf(item).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    if (categoryFilter !== "All") {
      list = list.filter(
        (item) => item.category === categoryFilter
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();

      list = list.filter((item) => {
        const values = [
          item.title,
          item.description,
          item.userName,
          item.parentName,
          item.staffName,
          item.userEmail,
          item.email,
          item.category,
          item.raisedBy,
          complaintId(item),
        ];

        return values.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      });
    }

    return list.sort(
      (a, b) =>
        (toDate(b.createdAt)?.getTime() || 0) -
        (toDate(a.createdAt)?.getTime() || 0)
    );
  }, [
    complaints,
    statusFilter,
    categoryFilter,
    searchTerm,
  ]);

  // -----------------------------------------------------
  // STATISTICS
  // -----------------------------------------------------

  const stats = useMemo(() => {
    const count = (status) =>
      complaints.filter(
        (item) =>
          statusOf(item).toLowerCase() === status.toLowerCase()
      ).length;

    const assigned = complaints.filter(
      (item) => item.assignedTo || item.assignedStaff
    ).length;

    return {
      total: complaints.length,
      pending: count("Pending"),
      inProgress: count("In Progress"),
      resolved: count("Resolved"),
      rejected: count("Rejected"),
      closed: count("Closed"),
      assigned,
      unassigned: complaints.length - assigned,
    };
  }, [complaints]);

  // -----------------------------------------------------
  // ADVANCED DASHBOARD ANALYTICS
  // -----------------------------------------------------

  const analytics = useMemo(() => {
    const statusItems = [
      { label: "Pending", value: stats.pending, color: "#d97706" },
      { label: "In Progress", value: stats.inProgress, color: "#2563eb" },
      { label: "Resolved", value: stats.resolved, color: "#16a34a" },
      { label: "Rejected", value: stats.rejected, color: "#dc2626" },
      { label: "Closed", value: stats.closed, color: "#64748b" },
    ];

    const now = new Date();
    const monthItems = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      monthItems.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
        value: 0,
      });
    }

    complaints.forEach((item) => {
      const date = toDate(item.createdAt || item.created_at || item.dateCreated);
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = monthItems.find((entry) => entry.key === key);
      if (month) month.value += 1;
    });

    const categoryMap = new Map();
    complaints.forEach((item) => {
      const category = String(item.category || item.complaintCategory || "Other").trim() || "Other";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const categoryItems = [...categoryMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const resolvedRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;
    const assignedRate = stats.total ? Math.round((stats.assigned / stats.total) * 100) : 0;

    return { statusItems, monthItems, categoryItems, resolvedRate, assignedRate };
  }, [complaints, stats]);

  // -----------------------------------------------------
  // STATISTICS CARD INTERACTION
  // -----------------------------------------------------

  const handleStatClick = (label) => {
    const statusMap = {
      "Total Complaints": "All",
      "Pending Complaints": "Pending",
      "In Progress": "In Progress",
      "Resolved Complaints": "Resolved",
      "Rejected Complaints": "Rejected",
    };

    setStatusFilter(statusMap[label] || "All");

    document.getElementById("complaints-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // -----------------------------------------------------
  // OPEN DETAILS
  // -----------------------------------------------------

  const openDetails = (item) => {
    setSelected(item);
    setShowDetails(true);
    setShowStatusModal(false);
    setCommentText("");
    setError("");
    setSuccess("");
  };

  const openStatus = (item) => {
    setSelected(item);
    setNewStatus(statusOf(item));
    setStatusReason("");
    setShowStatusModal(true);
    setShowDetails(false);
    setError("");
    setSuccess("");
  };

  // -----------------------------------------------------
  // UPDATE STATUS
  // -----------------------------------------------------

  const updateStatus = async (event) => {
    event.preventDefault();

    if (!selected) {
      setError("Please select a complaint.");
      return;
    }

    const id = complaintId(selected);

    if (!id) {
      setError("Complaint ID is missing.");
      return;
    }

    if (!statusReason.trim()) {
      setError("Please provide a reason for the status update.");
      return;
    }

    if (newStatus === statusOf(selected)) {
      setError("Please choose a different status.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await axios.patch(
        `${API_URL}/complaints/${encodeURIComponent(id)}/status`,
        {
          status: newStatus,
          note: statusReason.trim(),
        },
        authConfig()
      );

      setSuccess("Complaint status updated successfully.");
      setShowStatusModal(false);
      setStatusReason("");

      await fetchComplaints();
    } catch (err) {
      console.error("Error updating status:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update complaint status."
      );
    } finally {
      setUpdating(false);
    }
  };

  // -----------------------------------------------------
  // ADD COMMENT
  // -----------------------------------------------------

  const addComment = async (event) => {
    event.preventDefault();

    if (!selected) {
      setError("Please select a complaint.");
      return;
    }

    if (!commentText.trim()) {
      setError("Please enter a comment.");
      return;
    }

    const id = complaintId(selected);

    if (!id) {
      setError("Complaint ID is missing.");
      return;
    }

    try {
      setSendingComment(true);
      setError("");
      setSuccess("");

      await axios.post(
        `${API_URL}/complaints/${encodeURIComponent(id)}/comments`,
        { comment: commentText.trim() },
        authConfig()
      );

      setCommentText("");
      await fetchComplaints();

      const response = await axios.get(
        `${API_URL}/complaints`,
        authConfig()
      );

      const latest = normalizeList(response.data).find(
        (item) => complaintId(item) === id
      );

      if (latest) setSelected(latest);

      setSuccess("Comment added successfully.");
    } catch (err) {
      console.error("Error adding comment:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to add comment."
      );
    } finally {
      setSendingComment(false);
    }
  };

  // -----------------------------------------------------
  // DELETE COMPLAINT
  // -----------------------------------------------------

  const deleteComplaint = async (item) => {
    const id = complaintId(item);

    if (!id) {
      setError("Complaint ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this complaint? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await axios.delete(
        `${API_URL}/complaints/${encodeURIComponent(id)}`,
        authConfig()
      );

      setComplaints((previous) =>
        previous.filter((row) => complaintId(row) !== id)
      );

      if (complaintId(selected) === id) {
        setSelected(null);
        setShowDetails(false);
        setShowStatusModal(false);
      }

      setSuccess("Complaint deleted successfully.");
    } catch (err) {
      console.error("Error deleting complaint:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete complaint."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------------------
  // EXPORT PDF
  // -----------------------------------------------------

  const exportPDF = async () => {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      await generateComplaintPDF(filtered, {
        title: "Staff Complaint Report",
        generatedBy:
          user?.name ||
          user?.fullName ||
          user?.displayName ||
          "Staff",
      });

      setSuccess("Complaint PDF report generated successfully.");
    } catch (err) {
      console.error("PDF generation failed:", err);

      setError(
        err?.message ||
          "Unable to generate PDF. Check your PDF utility."
      );
    } finally {
      setExporting(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelected(null);
    setCommentText("");
  };

  const closeStatus = () => {
    setShowStatusModal(false);
    setStatusReason("");
  };

  // -----------------------------------------------------
  // LOADING SCREEN
  // -----------------------------------------------------

  if (loading) {
    return (
      <div style={s.loading}>
        <div style={s.loader} />
        <h2 style={s.heading}>Loading Staff Dashboard</h2>
        <p style={s.subtitle}>
          Please wait while we load your complaints.
        </p>
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN DASHBOARD
  // -----------------------------------------------------

  return (
    <div className="staff-dashboard-page" style={s.page}>
      <style>{`
        .staff-dashboard-page { --staff-blue: #2563eb; --staff-blue-dark: #1d4ed8; }
        .staff-dashboard-page button, .staff-dashboard-page input, .staff-dashboard-page select { font: inherit; }
        .staff-dashboard-page button:focus-visible,
        .staff-dashboard-page input:focus-visible,
        .staff-dashboard-page select:focus-visible { outline: 3px solid rgba(37, 99, 235, .28); outline-offset: 2px; }
        .staff-dashboard-page button:not(:disabled) { -webkit-tap-highlight-color: transparent; }
        .staff-dashboard-page .staff-stat-card:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(37, 99, 235, .11); }
        .staff-dashboard-page .staff-stat-card:active { transform: translateY(-1px); }
        @media (max-width: 900px) {
          .staff-dashboard-page { padding: 22px !important; }
          .staff-dashboard-page .staff-analytics-grid { grid-template-columns: 1fr !important; }
          .staff-dashboard-page section[aria-label="Complaint statistics"] { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .staff-dashboard-page .staff-filter-row { grid-template-columns: 1fr 1fr !important; }
          .staff-dashboard-page .staff-search-box { grid-column: 1 / -1; }
        }
        @media (max-width: 600px) {
          .staff-dashboard-page { padding: 14px !important; }
          .staff-dashboard-page section[aria-label="Complaint statistics"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .staff-dashboard-page .staff-filter-row { grid-template-columns: 1fr !important; }
          .staff-dashboard-page .staff-search-box { grid-column: auto; }
          .staff-dashboard-page .staff-panel { padding: 16px !important; border-radius: 14px !important; }
          .staff-dashboard-page .staff-header-actions { width: 100%; }
          .staff-dashboard-page .staff-header-actions > button { flex: 1; }
          .staff-dashboard-page .staff-stat-card { padding: 15px !important; }
          .staff-dashboard-page .staff-stat-card h2 { font-size: 24px !important; }
        }
        @media (max-width: 380px) {
          .staff-dashboard-page section[aria-label="Complaint statistics"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <header style={s.header}>
        <div>
          <p style={s.eyebrow}>STAFF DESK · CAMPUS PORTAL</p>

          <h1 style={s.heading}>Staff Dashboard</h1>

          <p style={s.subtitle}>
            Manage campus issues, track progress, and communicate
            with the campus community.
          </p>

          <p style={s.welcome}>
            Welcome back,{" "}
            <strong>
              {user?.name ||
                user?.fullName ||
                user?.displayName ||
                "Staff"}
            </strong>
          </p>
        </div>

        <div className="staff-header-actions" style={s.headerActions}>
          <NotificationBell dashboardPath="/staff-dashboard" />

          <button
            type="button"
            style={s.secondaryButton}
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            style={{
              ...s.primaryButton,
              ...(exporting || !filtered.length ? s.disabled : {}),
            }}
            onClick={exportPDF}
            disabled={exporting || !filtered.length}
          >
            {exporting ? "Generating PDF..." : "↓ Export PDF"}
          </button>
        </div>
      </header>

      {error && (
        <div style={s.error} role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            style={s.dismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={s.success} role="status">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            style={s.dismiss}
            aria-label="Dismiss success message"
          >
            ✕
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <section style={s.statsGrid} aria-label="Complaint statistics">
        {[
          {
            label: "Total Complaints",
            value: stats.total,
            icon: "▤",
            color: "#2563eb",
          },
          {
            label: "Pending Complaints",
            value: stats.pending,
            icon: "◷",
            color: "#b45309",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: "↻",
            color: "#1d4ed8",
          },
          {
            label: "Resolved Complaints",
            value: stats.resolved,
            icon: "✓",
            color: "#15803d",
          },
          {
            label: "Rejected Complaints",
            value: stats.rejected,
            icon: "×",
            color: "#b91c1c",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleStatClick(item.label)}
            aria-label={`Filter complaints: ${item.label}`}
            aria-pressed={
              (item.label === "Total Complaints" && statusFilter === "All") ||
              (item.label === "Pending Complaints" && statusFilter === "Pending") ||
              (item.label === "In Progress" && statusFilter === "In Progress") ||
              (item.label === "Resolved Complaints" && statusFilter === "Resolved") ||
              (item.label === "Rejected Complaints" && statusFilter === "Rejected")
            }
            className="staff-stat-card"
            style={{
              ...s.statCard,
              width: "100%",
              boxSizing: "border-box",
              textAlign: "left",
              fontFamily: "inherit",
              color: "inherit",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              borderColor:
                ((item.label === "Total Complaints" && statusFilter === "All") ||
                  (item.label === "Pending Complaints" && statusFilter === "Pending") ||
                  (item.label === "In Progress" && statusFilter === "In Progress") ||
                  (item.label === "Resolved Complaints" && statusFilter === "Resolved") ||
                  (item.label === "Rejected Complaints" && statusFilter === "Rejected"))
                  ? item.color
                  : undefined,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-3px)";
              event.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.10)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateY(0)";
              event.currentTarget.style.boxShadow = "";
            }}
            onFocus={(event) => {
              event.currentTarget.style.outline = `2px solid ${item.color}`;
              event.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(event) => {
              event.currentTarget.style.outline = "none";
            }}
          >
            <div
              style={{
                ...s.statIcon,
                color: item.color,
                background: `${item.color}18`,
              }}
              aria-hidden="true"
            >
              {item.icon}
            </div>

            <p style={s.statLabel}>{item.label}</p>
            <h2 style={s.statValue}>{item.value}</h2>
          </button>
        ))}
      </section>

      {/* ADVANCED ANALYTICS */}
      <section className="staff-analytics-grid" aria-label="Complaint analytics" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px", marginBottom: "24px" }}>
        <div className="staff-panel" style={{ ...s.panel, marginBottom: 0 }}>
          <div style={s.panelHeadingRow}>
            <div>
              <h2 style={s.sectionHeading}>Complaint Status Distribution</h2>
              <p style={s.panelSubtitle}>Current breakdown across all complaints.</p>
            </div>
            <span style={s.resultCount}>{stats.total} total</span>
          </div>

          {analytics.statusItems.map((item) => {
            const percent = stats.total ? Math.round((item.value / stats.total) * 100) : 0;
            return (
              <div key={item.label} style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "7px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-primary, #172033)", fontWeight: 650 }}>{item.label}</span>
                  <span style={{ color: "var(--text-secondary, #667085)" }}>{item.value} · {percent}%</span>
                </div>
                <div role="progressbar" aria-label={`${item.label} complaints`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} style={{ height: "9px", overflow: "hidden", borderRadius: "999px", background: "var(--border-color, #e8edf5)" }}>
                  <div style={{ width: `${percent}%`, height: "100%", borderRadius: "999px", background: item.color, transition: "width .35s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="staff-panel" style={{ ...s.panel, marginBottom: 0 }}>
          <div style={s.panelHeadingRow}>
            <div>
              <h2 style={s.sectionHeading}>Complaint Trends</h2>
              <p style={s.panelSubtitle}>Complaints submitted in the last six months.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", alignItems: "end", gap: "10px", height: "190px", paddingTop: "10px" }}>
            {analytics.monthItems.map((item) => {
              const max = Math.max(1, ...analytics.monthItems.map((month) => month.value));
              const height = item.value ? Math.max(8, (item.value / max) * 130) : 4;
              return (
                <div key={item.key} title={`${item.label}: ${item.value} complaints`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", minWidth: 0, gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 750, color: "var(--text-primary, #172033)" }}>{item.value}</span>
                  <div style={{ width: "min(100%, 34px)", height: `${height}px`, minHeight: "4px", borderRadius: "8px 8px 3px 3px", background: "linear-gradient(180deg, #60a5fa, #2563eb)", transition: "height .3s ease" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary, #667085)" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-secondary, #667085)" }}>Trend counts are based on complaint creation dates available in the records.</p>
        </div>

        <div className="staff-panel" style={{ ...s.panel, marginBottom: 0 }}>
          <div style={s.panelHeadingRow}>
            <div>
              <h2 style={s.sectionHeading}>Top Complaint Categories</h2>
              <p style={s.panelSubtitle}>Most frequently reported categories.</p>
            </div>
          </div>
          {analytics.categoryItems.length ? analytics.categoryItems.map((item, index) => {
            const max = Math.max(1, ...analytics.categoryItems.map((category) => category.value));
            const percent = Math.round((item.value / max) * 100);
            return (
              <div key={item.label} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "6px", fontSize: "13px" }}>
                  <span style={{ fontWeight: 650, color: "var(--text-primary, #172033)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{index + 1}. {item.label}</span>
                  <span style={{ color: "var(--text-secondary, #667085)", flexShrink: 0 }}>{item.value}</span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", overflow: "hidden", background: "var(--border-color, #e8edf5)" }}>
                  <div style={{ height: "100%", width: `${percent}%`, borderRadius: "999px", background: "#3b82f6" }} />
                </div>
              </div>
            );
          }) : <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary, #667085)" }}>Category data will appear here when complaints are available.</p>}
        </div>

        <div className="staff-panel" style={{ ...s.panel, marginBottom: 0 }}>
          <div style={s.panelHeadingRow}>
            <div>
              <h2 style={s.sectionHeading}>Resolution & Assignment</h2>
              <p style={s.panelSubtitle}>Quick operational overview for staff.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
            <div style={{ padding: "17px", borderRadius: "14px", border: "1px solid var(--border-color, #e5eaf2)", background: "var(--surface-secondary, #f8fafc)" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--text-secondary, #667085)" }}>Resolution rate</p>
              <strong style={{ fontSize: "28px", color: "#15803d" }}>{analytics.resolvedRate}%</strong>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary, #667085)" }}>{stats.resolved} resolved</p>
            </div>
            <div style={{ padding: "17px", borderRadius: "14px", border: "1px solid var(--border-color, #e5eaf2)", background: "var(--surface-secondary, #f8fafc)" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--text-secondary, #667085)" }}>Assignment rate</p>
              <strong style={{ fontSize: "28px", color: "#2563eb" }}>{analytics.assignedRate}%</strong>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary, #667085)" }}>{stats.assigned} assigned</p>
            </div>
          </div>
          <p style={{ margin: "14px 0 0", fontSize: "12px", lineHeight: 1.5, color: "var(--text-secondary, #667085)" }}>Rates are calculated from the complaints currently loaded in the dashboard.</p>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}

      <section id="complaints-section" className="staff-panel" style={s.panel}>
        <div style={s.panelHeadingRow}>
          <div>
            <h2 style={s.sectionHeading}>Manage Complaints</h2>
            <p style={s.panelSubtitle}>
              Search, filter, and review submitted issues.
            </p>
          </div>

          <span style={s.resultCount}>{filtered.length} results</span>
        </div>

        <div className="staff-filter-row" style={s.filterRow}>
          <div className="staff-search-box" style={s.searchBox}>
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Search title, ID, name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={s.searchInput}
              aria-label="Search complaints"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={s.input}
            aria-label="Filter by status"
          >
            {FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            style={s.input}
            aria-label="Filter by category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* COMPLAINT TABLE */}

      <section className="staff-panel" style={s.panel}>
        <div style={s.panelHeadingRow}>
          <div>
            <h2 style={s.sectionHeading}>Campus Complaints</h2>
            <p style={s.panelSubtitle}>
              Review complaint details and manage updates.
            </p>
          </div>

          <span style={s.resultCount}>
            {filtered.length} complaints
          </span>
        </div>

        {!filtered.length ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>▤</div>
            <h3 style={s.sectionHeading}>No complaints found</h3>
            <p style={s.subtitle}>
              Try changing your search term or filters.
            </p>

            {(searchTerm ||
              statusFilter !== "All" ||
              categoryFilter !== "All") && (
              <button
                type="button"
                style={s.secondaryButton}
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    "Complaint",
                    "Category",
                    "Submitted By",
                    "Date Submitted",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} style={s.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={complaintId(item)} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.complaintTitle}>
                        {item.title || "Untitled complaint"}
                      </div>

                      <div style={s.mutedText}>
                        ID: {complaintId(item) || "N/A"}
                      </div>
                    </td>

                    <td style={s.td}>
                      <span style={s.categoryBadge}>
                        {item.category || "General"}
                      </span>
                    </td>

                    <td style={s.td}>
                      <div style={s.complaintTitle}>
                        {getDisplayName(item)}
                      </div>

                      <div style={s.mutedText}>
                        {item.userEmail || item.email || "No email"}
                      </div>
                    </td>

                    <td style={s.td}>{formatDate(item.createdAt)}</td>

                    <td style={s.td}>
                      <span
                        style={{
                          ...s.statusBadge,
                          ...statusStyle(statusOf(item)),
                        }}
                      >
                        {statusOf(item)}
                      </span>
                    </td>

                    <td style={s.td}>
                      <div style={s.actionGroup}>
                        <button
                          type="button"
                          style={s.smallButton}
                          onClick={() => openDetails(item)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          style={s.smallPrimaryButton}
                          onClick={() => openStatus(item)}
                        >
                          Update
                        </button>

                        <button
                          type="button"
                          style={s.smallDangerButton}
                          onClick={() => deleteComplaint(item)}
                          disabled={deletingId === complaintId(item)}
                        >
                          {deletingId === complaintId(item)
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COMPLAINT DETAILS MODAL */}

      {showDetails && selected && (
        <div
          style={s.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <div
            style={s.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-details-heading"
          >
            <div style={s.modalHeader}>
              <div>
                <p style={s.eyebrow}>COMPLAINT DETAILS</p>
                <h2 id="complaint-details-heading" style={s.modalTitle}>
                  {selected.title || "Untitled complaint"}
                </h2>
              </div>

              <button
                type="button"
                style={s.closeButton}
                onClick={closeDetails}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={s.detailGrid}>
                <DetailItem
                  label="Complaint ID"
                  value={complaintId(selected) || "N/A"}
                />

                <DetailItem
                  label="Category"
                  value={selected.category || "General"}
                />

                <DetailItem
                  label="Submitted By"
                  value={getDisplayName(selected)}
                />

                <DetailItem
                  label="Email"
                  value={selected.userEmail || selected.email || "Not available"}
                />

                <DetailItem
                  label="Date Submitted"
                  value={formatDate(selected.createdAt)}
                />

                <DetailItem
                  label="Current Status"
                  value={
                    <span
                      style={{
                        ...s.statusBadge,
                        ...statusStyle(statusOf(selected)),
                      }}
                    >
                      {statusOf(selected)}
                    </span>
                  }
                />
              </div>

              <div style={s.detailSection}>
                <h3 style={s.detailHeading}>Description</h3>
                <p style={s.description}>
                  {selected.description || "No description provided."}
                </p>
              </div>

              {(() => {
                const location = getLocationDetails(selected.location);
                const mapsUrl = getMapsUrl(selected.location);

                if (!location.address && !mapsUrl) return null;

                return (
                  <div style={s.locationCard}>
                    <h3 style={s.detailHeading}>📍 Complaint Location</h3>

                    {location.address && (
                      <p style={s.description}>{location.address}</p>
                    )}

                    {location.latitude !== null &&
                      location.longitude !== null && (
                        <p style={s.mutedText}>
                          Coordinates: {location.latitude},{" "}
                          {location.longitude}
                        </p>
                      )}

                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={s.mapLink}
                      >
                        Open in Google Maps ↗
                      </a>
                    )}
                  </div>
                );
              })()}

              <div style={s.detailSection}>
                <h3 style={s.detailHeading}>Comments & Updates</h3>

                {getComments(selected).length === 0 ? (
                  <p style={s.mutedText}>No comments or updates yet.</p>
                ) : (
                  <div style={s.commentList}>
                    {getComments(selected).map((comment, index) => (
                      <div
                        key={comment.id || comment._id || index}
                        style={s.commentCard}
                      >
                        <div style={s.commentHeader}>
                          <strong style={s.commentAuthor}>
                            {comment.userName ||
                              comment.name ||
                              comment.author ||
                              comment.role ||
                              "User"}
                          </strong>

                          <span style={s.mutedText}>
                            {formatDate(
                              comment.createdAt ||
                                comment.timestamp ||
                                comment.date
                            )}
                          </span>
                        </div>

                        <p style={s.description}>
                          {comment.comment ||
                            comment.message ||
                            comment.text ||
                            comment.note ||
                            ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={addComment} style={s.commentForm}>
                  <label htmlFor="staff-comment" style={s.label}>
                    Add a comment
                  </label>

                  <textarea
                    id="staff-comment"
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                    placeholder="Write an update or comment..."
                    style={s.textarea}
                    rows={3}
                    required
                  />

                  <div style={s.formActions}>
                    <button
                      type="submit"
                      style={{
                        ...s.primaryButton,
                        ...(sendingComment ? s.disabled : {}),
                      }}
                      disabled={sendingComment}
                    >
                      {sendingComment ? "Sending..." : "Send Comment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div style={s.modalFooter}>
              <button
                type="button"
                style={s.secondaryButton}
                onClick={closeDetails}
              >
                Close
              </button>

              <button
                type="button"
                style={s.primaryButton}
                onClick={() => openStatus(selected)}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}

      {showStatusModal && selected && (
        <div
          style={s.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStatus();
          }}
        >
          <div
            style={s.modalSmall}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-status-heading"
          >
            <div style={s.modalHeader}>
              <div>
                <p style={s.eyebrow}>COMPLAINT MANAGEMENT</p>
                <h2 id="update-status-heading" style={s.modalTitle}>
                  Update Complaint Status
                </h2>
              </div>

              <button
                type="button"
                style={s.closeButton}
                onClick={closeStatus}
                aria-label="Close status modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={updateStatus}>
              <div style={s.modalBody}>
                <div style={s.currentStatusBox}>
                  <span style={s.label}>Current status</span>

                  <span
                    style={{
                      ...s.statusBadge,
                      ...statusStyle(statusOf(selected)),
                    }}
                  >
                    {statusOf(selected)}
                  </span>
                </div>

                <label htmlFor="new-status" style={s.label}>
                  New status
                </label>

                <select
                  id="new-status"
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  style={s.inputFull}
                  required
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <label htmlFor="status-reason" style={s.label}>
                  Reason for update
                </label>

                <textarea
                  id="status-reason"
                  value={statusReason}
                  onChange={(event) =>
                    setStatusReason(event.target.value)
                  }
                  placeholder="Explain why the status is changing..."
                  style={s.textarea}
                  rows={4}
                  required
                />
              </div>

              <div style={s.modalFooter}>
                <button
                  type="button"
                  style={s.secondaryButton}
                  onClick={closeStatus}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...s.primaryButton,
                    ...(updating ? s.disabled : {}),
                  }}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// DETAIL ITEM
// =====================================================

function DetailItem({ label, value }) {
  return (
    <div style={s.detailItem}>
      <span style={s.detailLabel}>{label}</span>
      <div style={s.detailValue}>{value || "Not available"}</div>
    </div>
  );
}

// =====================================================
// THEME-AWARE STYLES
// =====================================================

const s = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "var(--dashboard-bg, #f3f6fc)",
    color: "var(--text-primary, #172033)",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    transition: "background 0.25s ease, color 0.25s ease",
    boxSizing: "border-box",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "var(--dashboard-bg, #f5f7fb)",
    color: "var(--text-primary, #172033)",
  },

  loader: {
    width: "42px",
    height: "42px",
    border: "4px solid var(--border-color, #e5e7eb)",
    borderTop: "4px solid var(--primary, #2563eb)",
    borderRadius: "50%",
    animation: "staffSpin 0.8s linear infinite",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 8px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.6px",
    textTransform: "uppercase",
    color: "var(--primary, #2563eb)",
  },

  heading: {
    margin: "0 0 10px",
    fontSize: "clamp(26px, 3vw, 34px)",
    fontWeight: 800,
    color: "var(--text-heading, var(--text-primary, #172033))",
  },

  subtitle: {
    margin: "0 0 12px",
    lineHeight: 1.6,
    fontSize: "14px",
    color: "var(--text-secondary, #667085)",
  },

  welcome: {
    margin: "0",
    fontSize: "14px",
    color: "var(--text-secondary, #667085)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid var(--border-color, #e4eaf4)",
    background: "var(--card-bg, #ffffff)",
    boxShadow: "var(--card-shadow, 0 8px 24px rgba(15, 23, 42, 0.045))",
    minWidth: 0,
    transition: "background 0.25s ease, border-color 0.25s ease",
  },

  statIcon: {
    display: "flex",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: 800,
    marginBottom: "14px",
  },

  statLabel: {
    margin: "0 0 8px",
    fontSize: "13px",
    color: "var(--text-secondary, #667085)",
  },

  statValue: {
    margin: "0",
    fontSize: "28px",
    fontWeight: 800,
    color: "var(--text-heading, var(--text-primary, #172033))",
  },

  panel: {
    padding: "24px",
    marginBottom: "24px",
    borderRadius: "18px",
    border: "1px solid var(--border-color, #e4eaf4)",
    background: "var(--card-bg, #ffffff)",
    boxShadow: "var(--card-shadow, 0 8px 24px rgba(15, 23, 42, 0.045))",
    minWidth: 0,
    transition: "background 0.25s ease, border-color 0.25s ease",
  },

  panelHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  sectionHeading: {
    margin: "0 0 6px",
    fontSize: "18px",
    fontWeight: 800,
    color: "var(--text-heading, var(--text-primary, #172033))",
  },

  panelSubtitle: {
    margin: "0",
    fontSize: "13px",
    color: "var(--text-secondary, #667085)",
  },

  resultCount: {
    padding: "7px 11px",
    borderRadius: "999px",
    background: "var(--surface-secondary, #f2f4f7)",
    color: "var(--text-secondary, #475467)",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  filterRow: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) repeat(2, minmax(150px, 220px))",
    gap: "12px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    padding: "0 12px",
    border: "1px solid var(--input-border, var(--border-color, #d0d5dd))",
    borderRadius: "10px",
    background: "var(--input-bg, var(--card-bg, #ffffff))",
    color: "var(--text-secondary, #667085)",
  },

  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "12px 0",
    outline: "none",
    border: "none",
    background: "transparent",
    color: "var(--text-primary, #172033)",
    fontSize: "13px",
  },

  input: {
    width: "100%",
    minWidth: 0,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid var(--input-border, var(--border-color, #d0d5dd))",
    background: "var(--input-bg, var(--card-bg, #ffffff))",
    color: "var(--text-primary, #172033)",
    fontSize: "13px",
    outline: "none",
  },

  inputFull: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    margin: "8px 0 18px",
    borderRadius: "10px",
    border: "1px solid var(--input-border, var(--border-color, #d0d5dd))",
    background: "var(--input-bg, var(--card-bg, #ffffff))",
    color: "var(--text-primary, #172033)",
    fontSize: "14px",
    outline: "none",
  },

  primaryButton: {
    padding: "11px 15px",
    borderRadius: "10px",
    border: "1px solid var(--primary, #2563eb)",
    background: "linear-gradient(135deg, var(--primary, #2563eb), #1d4ed8)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.2s ease, background 0.2s ease",
  },

  secondaryButton: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border-color, #d0d5dd)",
    background: "var(--card-bg, #ffffff)",
    color: "var(--text-primary, #344054)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  disabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
    border: "1px solid var(--error-border, #fecaca)",
    borderRadius: "12px",
    background: "var(--error-bg, #fef2f2)",
    color: "var(--error-text, #b91c1c)",
    fontSize: "14px",
  },

  success: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
    border: "1px solid var(--success-border, #bbf7d0)",
    borderRadius: "12px",
    background: "var(--success-bg, #f0fdf4)",
    color: "var(--success-text, #166534)",
    fontSize: "14px",
  },

  dismiss: {
    border: "none",
    background: "transparent",
    color: "inherit",
    fontSize: "16px",
    cursor: "pointer",
  },

  empty: {
    padding: "50px 20px",
    textAlign: "center",
    color: "var(--text-secondary, #667085)",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom: "12px",
    color: "var(--text-muted, #98a2b3)",
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid var(--border-color, #e5e7eb)",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "collapse",
    background: "var(--card-bg, #ffffff)",
    color: "var(--text-primary, #172033)",
    fontSize: "13px",
  },

  th: {
    padding: "14px 16px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary, #667085)",
    background: "var(--surface-secondary, #f9fafb)",
    borderBottom: "1px solid var(--border-color, #e5e7eb)",
  },

  tr: {
    borderBottom: "1px solid var(--border-color, #e5e7eb)",
  },

  td: {
    padding: "16px",
    verticalAlign: "middle",
    color: "var(--text-primary, #172033)",
  },

  complaintTitle: {
    marginBottom: "5px",
    fontWeight: 700,
    color: "var(--text-primary, #172033)",
    overflowWrap: "anywhere",
  },

  mutedText: {
    fontSize: "12px",
    lineHeight: 1.6,
    color: "var(--text-muted, #667085)",
    overflowWrap: "anywhere",
  },

  categoryBadge: {
    display: "inline-block",
    padding: "6px 9px",
    borderRadius: "8px",
    background: "var(--surface-secondary, #f2f4f7)",
    color: "var(--text-secondary, #475467)",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  actionGroup: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
  },

  smallButton: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid var(--border-color, #d0d5dd)",
    background: "var(--card-bg, #ffffff)",
    color: "var(--text-primary, #344054)",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  smallPrimaryButton: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid var(--primary, #2563eb)",
    background: "var(--primary, #2563eb)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  smallDangerButton: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid var(--danger, #dc2626)",
    background: "var(--danger, #dc2626)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(0, 0, 0, 0.58)",
    backdropFilter: "blur(3px)",
  },

  modal: {
    width: "min(850px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "18px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--modal-bg, var(--card-bg, #ffffff))",
    color: "var(--text-primary, #172033)",
    boxShadow: "var(--modal-shadow, 0 24px 80px rgba(0,0,0,0.25))",
  },

  modalSmall: {
    width: "min(520px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "18px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--modal-bg, var(--card-bg, #ffffff))",
    color: "var(--text-primary, #172033)",
    boxShadow: "var(--modal-shadow, 0 24px 80px rgba(0,0,0,0.25))",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    padding: "22px 24px",
    borderBottom: "1px solid var(--border-color, #e5e7eb)",
  },

  modalTitle: {
    margin: "0",
    fontSize: "21px",
    fontWeight: 800,
    lineHeight: 1.4,
    color: "var(--text-heading, var(--text-primary, #172033))",
    overflowWrap: "anywhere",
  },

  closeButton: {
    flexShrink: 0,
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--surface-secondary, #f9fafb)",
    color: "var(--text-primary, #344054)",
    fontSize: "16px",
    cursor: "pointer",
  },

  modalBody: {
    padding: "24px",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    padding: "18px 24px",
    borderTop: "1px solid var(--border-color, #e5e7eb)",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },

  detailItem: {
    minWidth: 0,
    padding: "14px",
    borderRadius: "11px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--surface-secondary, #f9fafb)",
  },

  detailLabel: {
    display: "block",
    marginBottom: "7px",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-muted, #667085)",
  },

  detailValue: {
    fontSize: "13px",
    lineHeight: 1.6,
    fontWeight: 600,
    color: "var(--text-primary, #172033)",
    overflowWrap: "anywhere",
  },

  detailSection: {
    marginTop: "22px",
  },

  detailHeading: {
    margin: "0 0 12px",
    fontSize: "15px",
    fontWeight: 800,
    color: "var(--text-heading, var(--text-primary, #172033))",
  },

  description: {
    margin: "0",
    fontSize: "13px",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    color: "var(--text-primary, #344054)",
  },

  locationCard: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--surface-secondary, #f9fafb)",
  },

  mapLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "var(--primary, #2563eb)",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
  },

  commentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "18px",
  },

  commentCard: {
    padding: "14px",
    borderRadius: "11px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--surface-secondary, #f9fafb)",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "8px",
  },

  commentAuthor: {
    fontSize: "13px",
    color: "var(--text-primary, #172033)",
  },

  commentForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "16px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--text-primary, #344054)",
  },

  textarea: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid var(--input-border, var(--border-color, #d0d5dd))",
    background: "var(--input-bg, var(--card-bg, #ffffff))",
    color: "var(--text-primary, #172033)",
    fontSize: "13px",
    lineHeight: 1.6,
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },

  currentStatusBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid var(--border-color, #e5e7eb)",
    background: "var(--surface-secondary, #f9fafb)",
  },
};

// =====================================================
// LOADER ANIMATION
// =====================================================

if (typeof document !== "undefined" && !document.getElementById("staff-dashboard-animation")) {
  const style = document.createElement("style");
  style.id = "staff-dashboard-animation";
  style.textContent = `
    @keyframes staffSpin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 850px) {
      .staff-dashboard-responsive {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}