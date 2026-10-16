import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = "http://localhost:5000/api";

const FILTER_OPTIONS = [
  "All",
  "Pending",
  "In Progress",
  "Resolved",
  "Rejected",
];

const getToken = () => localStorage.getItem("token");

const getStoredUser = () => {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const formatDate = (value) => {
  if (!value) return "N/A";

  try {
    if (
      typeof value === "object" &&
      typeof value.toDate === "function"
    ) {
      return value.toDate().toLocaleString();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleString();
  } catch {
    return "N/A";
  }
};

const normalizeStatus = (status) =>
  String(status || "Pending").trim();

const getStatusStyle = (status) => {
  const normalized = normalizeStatus(status).toLowerCase();

  const statusStyles = {
    pending: {
      background: "var(--badge-pending-bg)",
      color: "var(--badge-pending-text)",
    },
    "in progress": {
      background: "var(--badge-progress-bg)",
      color: "var(--badge-progress-text)",
    },
    resolved: {
      background: "var(--badge-resolved-bg)",
      color: "var(--badge-resolved-text)",
    },
    rejected: {
      background: "var(--badge-rejected-bg)",
      color: "var(--badge-rejected-text)",
    },
  };

  return (
    statusStyles[normalized] || {
      background: "var(--badge-neutral-bg)",
      color: "var(--badge-neutral-text)",
    }
  );
};

const getPriorityStyle = (priority) => {
  const normalized = String(priority || "Medium").toLowerCase();

  const priorityStyles = {
    high: {
      background: "var(--badge-rejected-bg)",
      color: "var(--badge-rejected-text)",
    },
    medium: {
      background: "var(--badge-pending-bg)",
      color: "var(--badge-pending-text)",
    },
    low: {
      background: "var(--badge-resolved-bg)",
      color: "var(--badge-resolved-text)",
    },
  };

  return (
    priorityStyles[normalized] || {
      background: "var(--badge-neutral-bg)",
      color: "var(--badge-neutral-text)",
    }
  );
};

/* =========================================================
   THEME-AWARE DASHBOARD STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--dashboard-bg)",
    color: "var(--text-primary)",
    padding: "30px",
    boxSizing: "border-box",
    transition: "background 0.25s ease, color 0.25s ease",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 750,
    letterSpacing: "-0.7px",
    color: "var(--text-heading)",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--text-muted)",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  refreshButton: {
    border: "none",
    background: "var(--primary)",
    color: "#FFFFFF",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 650,
    fontSize: "13px",
    boxShadow: "0 3px 8px rgba(37,99,235,0.18)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px",
    marginBottom: "25px",
  },

  statCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "var(--card-shadow)",
    transition: "background 0.25s ease, border-color 0.25s ease",
  },

  statLabel: {
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "12px",
  },

  statValue: {
    fontSize: "30px",
    fontWeight: 750,
    color: "var(--text-heading)",
    lineHeight: 1.2,
  },

  filterBox: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "20px",
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid var(--border-color)",
    background: "var(--surface-secondary)",
    color: "var(--text-primary)",
    padding: "9px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },

  activeFilter: {
    background: "var(--primary)",
    color: "#FFFFFF",
    borderColor: "var(--primary)",
  },

  complaintGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "20px",
  },

  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "var(--card-shadow)",
    minWidth: 0,
    transition:
      "background 0.25s ease, border-color 0.25s ease, transform 0.2s ease",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "15px",
  },

  complaintTitle: {
    margin: 0,
    color: "var(--text-heading)",
    fontSize: "19px",
    fontWeight: 700,
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },

  badgeRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 750,
    letterSpacing: "0.15px",
  },

  description: {
    color: "var(--text-secondary)",
    fontSize: "14px",
    lineHeight: 1.75,
    margin: "15px 0",
    overflowWrap: "anywhere",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    padding: "11px 0",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "13px",
  },

  infoLabel: {
    color: "var(--text-muted)",
    fontWeight: 600,
    flexShrink: 0,
  },

  infoValue: {
    color: "var(--text-primary)",
    textAlign: "right",
    maxWidth: "65%",
    wordBreak: "break-word",
  },

  actionRow: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  actionButton: {
    border: "1px solid var(--border-color)",
    background: "var(--surface-secondary)",
    color: "var(--text-primary)",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 650,
    fontSize: "12px",
    transition: "background 0.2s ease",
  },

  empty: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "55px 20px",
    textAlign: "center",
    color: "var(--text-muted)",
    boxShadow: "var(--card-shadow)",
  },

  loading: {
    textAlign: "center",
    padding: "50px",
    color: "var(--text-muted)",
  },

  error: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
    padding: "13px 16px",
    borderRadius: "9px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.72)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    width: "100%",
    maxWidth: "650px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "var(--modal-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "25px",
    boxSizing: "border-box",
    boxShadow: "var(--modal-shadow)",
  },

  modalTitle: {
    margin: 0,
    fontSize: "23px",
    fontWeight: 750,
    color: "var(--text-heading)",
    overflowWrap: "anywhere",
  },

  modalSubtitle: {
    margin: "8px 0 20px",
    color: "var(--text-muted)",
    fontSize: "13px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  commentsBox: {
    marginTop: "22px",
    borderTop: "1px solid var(--border-color)",
    paddingTop: "18px",
  },

  discussionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    color: "var(--text-heading)",
  },

  commentItem: {
    background: "var(--surface-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "9px",
    padding: "12px",
    marginTop: "10px",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "12px",
    marginBottom: "7px",
    flexWrap: "wrap",
  },

  commentName: {
    fontWeight: 750,
    color: "var(--text-heading)",
  },

  commentDate: {
    color: "var(--text-muted)",
  },

  commentText: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: "13px",
    lineHeight: 1.65,
    overflowWrap: "anywhere",
  },

  commentInputRow: {
    display: "flex",
    gap: "9px",
    marginTop: "14px",
    flexWrap: "wrap",
  },

  commentInput: {
    flex: "1 1 200px",
    minWidth: 0,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "11px 12px",
    outline: "none",
    fontSize: "13px",
  },

  commentButton: {
    border: "none",
    background: "var(--primary)",
    color: "#FFFFFF",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 650,
  },

  closeButton: {
    border: "1px solid var(--border-color)",
    background: "var(--surface-secondary)",
    color: "var(--text-primary)",
    padding: "10px 17px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 650,
    marginTop: "20px",
  },

  noComments: {
    color: "var(--text-muted)",
    fontSize: "13px",
    margin: "12px 0",
  },

  modalDescription: {
    marginTop: "18px",
    color: "var(--text-secondary)",
    fontSize: "14px",
    lineHeight: 1.75,
    overflowWrap: "anywhere",
  },
};

/* =========================================================
   PARENT DASHBOARD
========================================================= */

const ParentDashboard = () => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;

    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      localStorage.getItem("theme") === "dark"
    );
  });

  const storedUser = useMemo(() => getStoredUser(), []);
  const currentUser = user || storedUser;

  /*
   * Synchronize this dashboard with the Navbar theme.
   * The Navbar should update data-theme and localStorage.
   */
  useEffect(() => {
    const syncTheme = () => {
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        localStorage.getItem("theme") === "dark";

      setIsDark(dark);
    };

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("themechange", syncTheme);

    syncTheme();

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themechange", syncTheme);
    };
  }, []);

  const dashboardStyles = useMemo(() => {
    return styles;
  }, [isDark]);

  /* =======================================================
     FETCH PARENT COMPLAINTS
  ======================================================= */

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `${API_URL}/complaints/parent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;

      let complaintList = [];

      if (Array.isArray(responseData)) {
        complaintList = responseData;
      } else if (Array.isArray(responseData?.complaints)) {
        complaintList = responseData.complaints;
      } else if (Array.isArray(responseData?.data)) {
        complaintList = responseData.data;
      }

      setComplaints(complaintList);
    } catch (err) {
      console.error("Fetch parent complaints error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load your complaints."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  /* =======================================================
     FILTER COMPLAINTS
  ======================================================= */

  const filteredComplaints = useMemo(() => {
    if (filter === "All") return complaints;

    return complaints.filter(
      (complaint) =>
        normalizeStatus(complaint.status).toLowerCase() ===
        filter.toLowerCase()
    );
  }, [complaints, filter]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(
    () => ({
      total: complaints.length,

      pending: complaints.filter(
        (complaint) =>
          normalizeStatus(complaint.status).toLowerCase() === "pending"
      ).length,

      progress: complaints.filter(
        (complaint) =>
          normalizeStatus(complaint.status).toLowerCase() ===
          "in progress"
      ).length,

      resolved: complaints.filter(
        (complaint) =>
          normalizeStatus(complaint.status).toLowerCase() === "resolved"
      ).length,

      rejected: complaints.filter(
        (complaint) =>
          normalizeStatus(complaint.status).toLowerCase() === "rejected"
      ).length,
    }),
    [complaints]
  );

  /* =======================================================
     COMPLAINT DETAILS
  ======================================================= */

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setCommentText("");
  };

  const closeDetails = () => {
    if (addingComment) return;

    setSelectedComplaint(null);
    setCommentText("");
  };

  /* =======================================================
     ADD COMMENT
  ======================================================= */

  const handleAddComment = async () => {
    if (!selectedComplaint) return;

    if (!commentText.trim()) {
      alert("Please enter a comment.");
      return;
    }

    try {
      setAddingComment(true);

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const complaintId =
        selectedComplaint.id || selectedComplaint._id;

      await axios.post(
        `${API_URL}/complaints/${complaintId}/comments`,
        {
          comment: commentText.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCommentText("");

      const response = await axios.get(
        `${API_URL}/complaints/parent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;

      let complaintList = [];

      if (Array.isArray(responseData)) {
        complaintList = responseData;
      } else if (Array.isArray(responseData?.complaints)) {
        complaintList = responseData.complaints;
      } else if (Array.isArray(responseData?.data)) {
        complaintList = responseData.data;
      }

      setComplaints(complaintList);

      const updatedComplaint = complaintList.find(
        (complaint) =>
          String(complaint.id || complaint._id) ===
          String(complaintId)
      );

      if (updatedComplaint) {
        setSelectedComplaint(updatedComplaint);
      } else {
        setSelectedComplaint((previous) =>
          previous
            ? {
                ...previous,
                comments: [
                  ...(previous.comments || []),
                  {
                    comment: commentText.trim(),
                    userName:
                      currentUser?.name ||
                      currentUser?.fullName ||
                      "Parent",
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : null
        );
      }
    } catch (err) {
      console.error("Parent comment error:", err);

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add comment."
      );
    } finally {
      setAddingComment(false);
    }
  };

  /* =======================================================
     RENDER COMMENTS
  ======================================================= */

  const renderComments = (complaint) => {
    let comments = [];

    if (Array.isArray(complaint.comments)) {
      comments = complaint.comments;
    } else if (Array.isArray(complaint.discussion)) {
      comments = complaint.discussion;
    } else if (Array.isArray(complaint.notes)) {
      comments = complaint.notes;
    }

    if (comments.length === 0) {
      return (
        <p style={dashboardStyles.noComments}>
          No comments yet.
        </p>
      );
    }

    return comments.map((comment, index) => (
      <div
        key={comment.id || comment._id || index}
        style={dashboardStyles.commentItem}
      >
        <div style={dashboardStyles.commentHeader}>
          <span style={dashboardStyles.commentName}>
            {comment.userName ||
              comment.senderName ||
              comment.name ||
              "User"}
          </span>

          <span style={dashboardStyles.commentDate}>
            {formatDate(comment.createdAt)}
          </span>
        </div>

        <p style={dashboardStyles.commentText}>
          {comment.comment || comment.message || comment.text || ""}
        </p>
      </div>
    ));
  };

  /* =======================================================
     DASHBOARD JSX
  ======================================================= */

  return (
    <div style={dashboardStyles.page}>
      <div style={dashboardStyles.container}>
        {/* HEADER */}
        <div style={dashboardStyles.header}>
          <div>
            <h1 style={dashboardStyles.title}>
              Parent Dashboard
            </h1>

            <p style={dashboardStyles.subtitle}>
              Track and manage the complaints raised by you.
              {currentUser?.name || currentUser?.fullName
                ? ` Welcome, ${
                    currentUser.name || currentUser.fullName
                  }.`
                : ""}
            </p>
          </div>

          <button
            type="button"
            style={dashboardStyles.refreshButton}
            onClick={fetchComplaints}
            disabled={loading}
          >
            {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div style={dashboardStyles.error}>
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div style={dashboardStyles.statsGrid}>
          {[
            {
              label: "Total Complaints",
              value: statistics.total,
              icon: "📋",
            },
            {
              label: "Pending",
              value: statistics.pending,
              icon: "⏳",
            },
            {
              label: "In Progress",
              value: statistics.progress,
              icon: "🔄",
            },
            {
              label: "Resolved",
              value: statistics.resolved,
              icon: "✅",
            },
            {
              label: "Rejected",
              value: statistics.rejected,
              icon: "❌",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={dashboardStyles.statCard}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={dashboardStyles.statLabel}>
                  {stat.label}
                </div>

                <span
                  aria-hidden="true"
                  style={{ fontSize: "20px" }}
                >
                  {stat.icon}
                </span>
              </div>

              <div style={dashboardStyles.statValue}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={dashboardStyles.filterBox}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              style={{
                ...dashboardStyles.filterButton,
                ...(filter === option
                  ? dashboardStyles.activeFilter
                  : {}),
              }}
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
            >
              {option}
            </button>
          ))}
        </div>

        {/* COMPLAINT CONTENT */}
        {loading ? (
          <div style={dashboardStyles.loading}>
            Loading your complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={dashboardStyles.empty}>
            <div
              style={{
                fontSize: "42px",
                marginBottom: "14px",
              }}
            >
              📋
            </div>

            <h3
              style={{
                color: "var(--text-heading)",
                marginBottom: "8px",
              }}
            >
              No complaints found
            </h3>

            <p>
              You have no complaints under the selected filter.
            </p>
          </div>
        ) : (
          <div style={dashboardStyles.complaintGrid}>
            {filteredComplaints.map((complaint) => {
              const complaintId =
                complaint.id || complaint._id;

              const status = normalizeStatus(complaint.status);

              return (
                <article
                  key={complaintId}
                  style={dashboardStyles.card}
                >
                  {/* COMPLAINT TITLE */}
                  <div style={dashboardStyles.cardTop}>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={dashboardStyles.complaintTitle}>
                        {complaint.title || "Untitled Complaint"}
                      </h2>

                      <div style={dashboardStyles.badgeRow}>
                        <span
                          style={{
                            ...dashboardStyles.badge,
                            ...getStatusStyle(status),
                          }}
                        >
                          {status}
                        </span>

                        <span
                          style={{
                            ...dashboardStyles.badge,
                            ...getPriorityStyle(complaint.priority),
                          }}
                        >
                          {complaint.priority || "Medium"} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <p style={dashboardStyles.description}>
                    {complaint.description ||
                      "No description provided."}
                  </p>

                  {/* CATEGORY */}
                  <div style={dashboardStyles.infoRow}>
                    <span style={dashboardStyles.infoLabel}>
                      Category
                    </span>

                    <span style={dashboardStyles.infoValue}>
                      {complaint.category || "Other"}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div style={dashboardStyles.infoRow}>
                    <span style={dashboardStyles.infoLabel}>
                      Status
                    </span>

                    <span
                      style={{
                        ...dashboardStyles.infoValue,
                        fontWeight: 700,
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  {/* SUBMISSION DATE */}
                  <div style={dashboardStyles.infoRow}>
                    <span style={dashboardStyles.infoLabel}>
                      Submitted
                    </span>

                    <span style={dashboardStyles.infoValue}>
                      {formatDate(complaint.createdAt)}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div style={dashboardStyles.actionRow}>
                    <button
                      type="button"
                      style={dashboardStyles.actionButton}
                      onClick={() => openDetails(complaint)}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================
          COMPLAINT DETAILS MODAL
      =================================================== */}

      {selectedComplaint && (
        <div
          style={dashboardStyles.modalOverlay}
          onClick={closeDetails}
        >
          <div
            style={dashboardStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="complaint-modal-title"
              style={dashboardStyles.modalTitle}
            >
              {selectedComplaint.title || "Complaint Details"}
            </h2>

            <p style={dashboardStyles.modalSubtitle}>
              Complaint ID:{" "}
              {selectedComplaint.id ||
                selectedComplaint._id ||
                "N/A"}
            </p>

            {/* STATUS */}
            <div style={dashboardStyles.infoRow}>
              <span style={dashboardStyles.infoLabel}>
                Status
              </span>

              <span style={dashboardStyles.infoValue}>
                {normalizeStatus(selectedComplaint.status)}
              </span>
            </div>

            {/* CATEGORY */}
            <div style={dashboardStyles.infoRow}>
              <span style={dashboardStyles.infoLabel}>
                Category
              </span>

              <span style={dashboardStyles.infoValue}>
                {selectedComplaint.category || "Other"}
              </span>
            </div>

            {/* PRIORITY */}
            <div style={dashboardStyles.infoRow}>
              <span style={dashboardStyles.infoLabel}>
                Priority
              </span>

              <span style={dashboardStyles.infoValue}>
                {selectedComplaint.priority || "Medium"}
              </span>
            </div>

            {/* DATE */}
            <div style={dashboardStyles.infoRow}>
              <span style={dashboardStyles.infoLabel}>
                Submitted
              </span>

              <span style={dashboardStyles.infoValue}>
                {formatDate(selectedComplaint.createdAt)}
              </span>
            </div>

            {/* DESCRIPTION */}
            <div style={dashboardStyles.modalDescription}>
              <strong
                style={{
                  display: "block",
                  color: "var(--text-heading)",
                  marginBottom: "8px",
                }}
              >
                Description
              </strong>

              <p>
                {selectedComplaint.description ||
                  "No description provided."}
              </p>
            </div>

            {/* DISCUSSION */}
            <div style={dashboardStyles.commentsBox}>
              <h3 style={dashboardStyles.discussionTitle}>
                Discussion
              </h3>

              {renderComments(selectedComplaint)}

              <div style={dashboardStyles.commentInputRow}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) =>
                    setCommentText(event.target.value)
                  }
                  placeholder="Write a comment..."
                  aria-label="Write a comment"
                  style={dashboardStyles.commentInput}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !addingComment
                    ) {
                      event.preventDefault();
                      handleAddComment();
                    }
                  }}
                />

                <button
                  type="button"
                  style={{
                    ...dashboardStyles.commentButton,
                    opacity: addingComment ? 0.65 : 1,
                    cursor: addingComment
                      ? "not-allowed"
                      : "pointer",
                  }}
                  disabled={addingComment}
                  onClick={handleAddComment}
                >
                  {addingComment ? "Sending..." : "Send"}
                </button>
              </div>
            </div>

            {/* CLOSE */}
            <button
              type="button"
              style={dashboardStyles.closeButton}
              onClick={closeDetails}
              disabled={addingComment}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
