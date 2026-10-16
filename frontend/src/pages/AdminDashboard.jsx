import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
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

const getToken = () => localStorage.getItem("token");

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getComplaintId = (complaint) =>
  complaint?.id ||
  complaint?._id ||
  complaint?.complaintId ||
  "";

const getRaisedBy = (complaint) => {
  const value =
    complaint?.raisedBy ||
    complaint?.submittedByRole ||
    complaint?.createdByRole ||
    complaint?.userRole ||
    complaint?.role ||
    "";

  return String(value || "Unknown").replace(/^./, (c) => c.toUpperCase());
};

/* =========================================================
   GET SUBMITTER EMAIL
========================================================= */

const getDisplayEmail = (complaint) => {
  const submittedBy = complaint?.submittedBy;
  const createdBy = complaint?.createdBy;

  const email =
    complaint?.parentEmail ||
    complaint?.staffEmail ||
    complaint?.submittedByEmail ||
    complaint?.createdByEmail ||
    complaint?.email ||
    (typeof submittedBy === "object" && submittedBy?.email) ||
    (typeof createdBy === "object" && createdBy?.email) ||
    complaint?.user?.email ||
    complaint?.parent?.email ||
    complaint?.staff?.email ||
    "";

  return typeof email === "string" && email.trim()
    ? email.trim()
    : "N/A";
};

/* =========================================================
   GET SUBMITTER NAME

   Priority:
   1. Actual saved name
   2. Name stored in the user object
   3. Readable name derived from email username
========================================================= */

const getDisplayName = (complaint) => {
  const user = complaint?.user;
  const submittedBy = complaint?.submittedBy;
  const createdBy = complaint?.createdBy;
  const parent = complaint?.parent;
  const staff = complaint?.staff;

  const possibleNames = [
    complaint?.parentName,
    complaint?.staffName,
    complaint?.submittedByName,
    complaint?.createdByName,
    complaint?.userName,
    complaint?.raisedByName,
    complaint?.fullName,
    complaint?.displayName,
    typeof submittedBy === "object"
      ? submittedBy?.fullName
      : null,
    typeof submittedBy === "object"
      ? submittedBy?.displayName
      : null,
    typeof submittedBy === "object"
      ? submittedBy?.name
      : null,
    typeof createdBy === "object"
      ? createdBy?.fullName
      : null,
    typeof createdBy === "object"
      ? createdBy?.displayName
      : null,
    typeof createdBy === "object"
      ? createdBy?.name
      : null,
    user?.fullName,
    user?.displayName,
    user?.name,
    parent?.fullName,
    parent?.displayName,
    parent?.name,
    staff?.fullName,
    staff?.displayName,
    staff?.name,
  ];

  const name = possibleNames.find(
    (value) =>
      typeof value === "string" &&
      value.trim() !== "" &&
      !value.includes("@")
  );

  if (name) {
    return name.trim();
  }

  // If no actual name exists, derive a readable name
  // from the email username.
  const email = getDisplayEmail(complaint);

  if (email !== "N/A" && email.includes("@")) {
    const username = email.split("@")[0];

    return username
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  return "Unknown User";
};

/* =========================================================
   DATE FORMATTING
========================================================= */

const formatDate = (value) => {
  if (!value) return "N/A";

  try {
    let dateValue = value;

    if (typeof value === "object" && value.seconds) {
      dateValue = value.seconds * 1000;
    } else if (
      typeof value === "object" &&
      typeof value.toDate === "function"
    ) {
      dateValue = value.toDate();
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

/* =========================================================
   STATUS STYLES
========================================================= */

const getStatusStyle = (status) => {
  const styles = {
    Pending: {
      bg: "#fff4d6",
      color: "#995c00",
    },
    "In Progress": {
      bg: "#dbeafe",
      color: "#1d4ed8",
    },
    Resolved: {
      bg: "#dcfce7",
      color: "#166534",
    },
    Rejected: {
      bg: "#fee2e2",
      color: "#b91c1c",
    },
    Closed: {
      bg: "#e5e7eb",
      color: "#374151",
    },
  };

  return styles[status] || styles.Pending;
};

/* =========================================================
   LOCATION
========================================================= */

const getLocation = (complaint) => {
  const location = complaint?.location;

  if (typeof location === "string") {
    return {
      address: location,
      latitude:
        complaint?.latitude ??
        complaint?.coordinates?.latitude,
      longitude:
        complaint?.longitude ??
        complaint?.coordinates?.longitude,
    };
  }

  return {
    address:
      location?.address ||
      location?.name ||
      complaint?.address ||
      complaint?.locationAddress ||
      "",
    latitude:
      location?.latitude ??
      location?.lat ??
      complaint?.latitude ??
      complaint?.coordinates?.latitude,
    longitude:
      location?.longitude ??
      location?.lng ??
      complaint?.longitude ??
      complaint?.coordinates?.longitude,
  };
};

/* =========================================================
   COMMENTS AND HISTORY
========================================================= */

const getComments = (complaint) => {
  const comments =
    complaint?.comments ||
    complaint?.discussion ||
    complaint?.notes ||
    [];

  return Array.isArray(comments) ? comments : [];
};

const getHistory = (complaint) => {
  const history =
    complaint?.statusHistory ||
    complaint?.history ||
    complaint?.statusUpdates ||
    [];

  return Array.isArray(history) ? history : [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong.";

/* =========================================================
   DETAIL ITEM
========================================================= */

const DetailItem = ({ label, value }) => (
  <div className="admin-detail-item">
    <span>{label}</span>
    <strong>{value || "N/A"}</strong>
  </div>
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

const AdminDashboard = () => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("In Progress");
  const [statusComment, setStatusComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getToken()}`,
    }),
    []
  );

  /* =======================================================
     FETCH COMPLAINTS
  ======================================================= */

  const fetchComplaints = useCallback(async () => {
    try {
      setError("");

      const response = await axios.get(`${API_URL}/complaints`, {
        headers: authHeaders,
      });

      const payload = response.data;

      const records = Array.isArray(payload)
        ? payload
        : payload?.complaints ||
          payload?.data?.complaints ||
          payload?.data ||
          [];

      const safeRecords = Array.isArray(records) ? records : [];

      setComplaints(safeRecords);

      setSelectedComplaint((current) => {
        if (!current) return null;

        const currentId = getComplaintId(current);

        return (
          safeRecords.find(
            (item) => getComplaintId(item) === currentId
          ) || current
        );
      });
    } catch (err) {
      console.error("Admin complaint fetch error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchComplaints();

    const interval = setInterval(fetchComplaints, 15000);

    return () => clearInterval(interval);
  }, [fetchComplaints]);

  /* =======================================================
     SEARCH AND FILTER
  ======================================================= */

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const status = complaint.status || "Pending";

      const matchesStatus =
        activeFilter === "All" || status === activeFilter;

      const matchesSearch =
        !query ||
        [
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.email,
          complaint.parentEmail,
          complaint.staffEmail,
          complaint.id,
          complaint.complaintId,
          getDisplayName(complaint),
          getDisplayEmail(complaint),
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [complaints, activeFilter, search]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(
    () => ({
      total: complaints.length,

      pending: complaints.filter(
        (item) => (item.status || "Pending") === "Pending"
      ).length,

      inProgress: complaints.filter(
        (item) => item.status === "In Progress"
      ).length,

      resolved: complaints.filter(
        (item) => item.status === "Resolved"
      ).length,

      rejected: complaints.filter(
        (item) => item.status === "Rejected"
      ).length,
    }),
    [complaints]
  );

  /* =======================================================
     DETAILS MODAL
  ======================================================= */

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setNewComment("");
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedComplaint(null);
    setNewComment("");
  };

  /* =======================================================
     STATUS MODAL
  ======================================================= */

  const openStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusToUpdate(complaint.status || "Pending");
    setStatusComment("");
    setShowDetails(false);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    if (updatingStatus) return;

    setShowStatusModal(false);
    setStatusComment("");
  };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;

    if (!statusComment.trim()) {
      alert("Please enter a comment or reason for the status update.");
      return;
    }

    try {
      setUpdatingStatus(true);

      const id = getComplaintId(selectedComplaint);

      await axios.patch(
        `${API_URL}/complaints/${id}/status`,
        {
          status: statusToUpdate,
          note: statusComment.trim(),
        },
        {
          headers: authHeaders,
        }
      );

      setShowStatusModal(false);
      setStatusComment("");

      await fetchComplaints();

      alert("Complaint status updated successfully.");
    } catch (err) {
      console.error("Status update error:", err);
      alert(getErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =======================================================
     ADD COMMENT
  ======================================================= */

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!selectedComplaint || !newComment.trim()) return;

    try {
      setAddingComment(true);

      const id = getComplaintId(selectedComplaint);

      await axios.post(
        `${API_URL}/complaints/${id}/comments`,
        {
          comment: newComment.trim(),
        },
        {
          headers: authHeaders,
        }
      );

      setNewComment("");

      const response = await axios.get(`${API_URL}/complaints`, {
        headers: authHeaders,
      });

      const payload = response.data;

      const records = Array.isArray(payload)
        ? payload
        : payload?.complaints ||
          payload?.data?.complaints ||
          payload?.data ||
          [];

      const refreshed = Array.isArray(records)
        ? records.find((item) => getComplaintId(item) === id)
        : null;

      if (refreshed) {
        setSelectedComplaint(refreshed);
        setComplaints((previous) =>
          previous.map((item) =>
            getComplaintId(item) === id ? refreshed : item
          )
        );
      }
    } catch (err) {
      console.error("Add comment error:", err);
      alert(getErrorMessage(err));
    } finally {
      setAddingComment(false);
    }
  };

  /* =======================================================
     DELETE COMPLAINT
  ======================================================= */

  const handleDelete = async (complaint) => {
    const id = getComplaintId(complaint);

    if (!id) {
      alert("Complaint ID is missing.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${
          complaint.title || "this complaint"
        }"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      await axios.delete(`${API_URL}/complaints/${id}`, {
        headers: authHeaders,
      });

      if (getComplaintId(selectedComplaint) === id) {
        closeDetails();
      }

      await fetchComplaints();
    } catch (err) {
      console.error("Delete complaint error:", err);
      alert(getErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  };

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  const handleExportPDF = async () => {
    try {
      await generateComplaintPDF(filteredComplaints, {
        title: "Admin Complaint Report",
        generatedBy:
          user?.name ||
          user?.fullName ||
          user?.displayName ||
          getStoredUser()?.email ||
          "Administrator",
      });
    } catch (err) {
      console.error("PDF export error:", err);
      alert(getErrorMessage(err));
    }
  };

  /* =======================================================
     GOOGLE MAPS
  ======================================================= */

  const openGoogleMaps = (complaint) => {
    const location = getLocation(complaint);

    let url = "";

    if (
      location.latitude != null &&
      location.longitude != null
    ) {
      url = `https://www.google.com/maps?q=${encodeURIComponent(
        location.latitude
      )},${encodeURIComponent(location.longitude)}`;
    } else if (location.address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location.address
      )}`;
    } else {
      alert("Location details are not available for this complaint.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-dashboard">
      <style>{`
        .admin-dashboard,
        .admin-dashboard * {
          box-sizing: border-box;
        }

        .admin-dashboard {
          --admin-accent: var(--primary, #215cff);
          min-height: 100vh;
          padding: 28px;
          background: var(--dashboard-bg, #f4f7fb);
          color: var(--text-primary, #172033);
          font-family: Inter, system-ui, -apple-system, sans-serif;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .admin-heading h1 {
          margin: 0;
          color: var(--text-heading, #172033);
          font-size: 30px;
          font-weight: 800;
        }

        .admin-heading p {
          margin: 8px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 14px;
        }

        .admin-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .admin-button {
          min-height: 42px;
          padding: 10px 16px;
          border: 1px solid var(--border-color, #d5deeb);
          border-radius: 10px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #26354c);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .admin-button-primary {
          border-color: var(--admin-accent);
          background: var(--admin-accent);
          color: #fff;
        }

        .admin-button:disabled,
        .admin-small-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .admin-stat {
          padding: 21px;
          border: 1px solid var(--border-color, #e3e9f2);
          border-radius: 15px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: var(--card-shadow, none);
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .admin-stat span {
          display: block;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          font-weight: 600;
        }

        .admin-stat strong {
          display: block;
          margin-top: 12px;
          color: var(--text-heading, #172033);
          font-size: 29px;
          font-weight: 800;
        }

        .admin-list-card {
          overflow: hidden;
          border: 1px solid var(--border-color, #e3e9f2);
          border-radius: 16px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: var(--card-shadow, none);
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .admin-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 22px;
          border-bottom: 1px solid var(--border-color, #e5eaf2);
        }

        .admin-list-header h2 {
          margin: 0;
          color: var(--text-heading, #172033);
          font-size: 19px;
        }

        .admin-search {
          width: min(100%, 330px);
          min-height: 42px;
          padding: 10px 13px;
          border: 1px solid var(--input-border, #d5deeb);
          border-radius: 10px;
          outline: none;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #172033);
          font: inherit;
          font-size: 13px;
        }

        .admin-search::placeholder,
        .admin-comment-input::placeholder {
          color: var(--text-muted, #94a3b8);
        }

        .admin-search:focus,
        .admin-comment-input:focus,
        .admin-status-select:focus {
          border-color: var(--admin-accent);
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-accent) 12%, transparent);
        }

        .admin-filters {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          padding: 17px 22px;
          border-bottom: 1px solid var(--border-color, #e5eaf2);
        }

        .admin-filter {
          padding: 8px 13px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--card-bg, #fff);
          color: var(--text-secondary, #475569);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-filter.active {
          border-color: var(--admin-accent);
          background: var(--admin-accent);
          color: #fff;
        }

        .admin-table-wrap {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .admin-table th {
          padding: 15px 18px;
          background: var(--surface-secondary, #f8fafc);
          color: var(--text-muted, #64748b);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .admin-table td {
          padding: 17px 18px;
          border-top: 1px solid var(--border-color, #edf1f6);
          color: var(--text-secondary, #475569);
          font-size: 13px;
          vertical-align: middle;
        }

        .admin-table tbody tr {
          transition: background 0.15s ease;
        }

        .admin-table tbody tr:hover {
          background: var(--surface-secondary, #f8fafc);
        }

        .admin-table td strong {
          color: var(--text-primary, #172033);
        }

        .admin-table-title {
          display: block;
          max-width: 240px;
          color: var(--text-heading, #172033);
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .admin-table-subtitle {
          display: block;
          margin-top: 5px;
          color: var(--text-muted, #94a3b8);
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        /* Submitted By name and email */

        .admin-submitted-name {
          display: block;
          color: var(--text-primary, #172033);
          font-size: 14px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .admin-submitted-email {
          display: block;
          margin-top: 5px;
          color: var(--text-secondary, #64748b);
          font-size: 12px;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .admin-badge {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .admin-row-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .admin-small-button {
          padding: 7px 10px;
          border: 1px solid var(--border-color, #dbe3ee);
          border-radius: 8px;
          background: var(--card-bg, #fff);
          color: var(--primary, #215cff);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-small-button.danger {
          color: var(--error-text, #dc2626);
        }

        .admin-empty {
          padding: 48px 20px;
          color: var(--text-secondary, #64748b);
          text-align: center;
          font-size: 14px;
        }

        .admin-error {
          padding: 14px 17px;
          margin-bottom: 18px;
          border: 1px solid var(--error-border, #fecaca);
          border-radius: 10px;
          background: var(--error-bg, #fef2f2);
          color: var(--error-text, #b91c1c);
          font-size: 13px;
        }

        .admin-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          background: rgba(15, 23, 42, 0.68);
          backdrop-filter: blur(4px);
        }

        .admin-details-modal {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1125px;
          height: min(90vh, 850px);
          overflow: hidden;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 22px;
          background: var(--modal-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: var(--modal-shadow, 0 25px 80px #0f172a40);
        }

        .admin-details-header {
          display: flex;
          flex-shrink: 0;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 27px 34px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          background: var(--modal-bg, #fff);
        }

        .admin-details-eyebrow {
          margin: 0 0 12px;
          color: var(--primary, #215cff);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .admin-details-header h2 {
          margin: 0;
          color: var(--text-heading, #111827);
          font-size: 28px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .admin-details-id {
          margin: 13px 0 0;
          color: var(--text-muted, #64748b);
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .admin-details-close-icon {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #334155);
          font-size: 28px;
          cursor: pointer;
        }

        .admin-details-content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 30px 34px;
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb, #94a3b8) transparent;
        }

        .admin-details-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          padding: 25px 22px;
          margin-bottom: 32px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          background: var(--surface-secondary, #f8fafc);
        }

        .admin-details-summary > div {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 11px;
        }

        .admin-details-summary span {
          color: var(--text-secondary, #64748b);
          font-size: 14px;
          font-weight: 650;
        }

        .admin-details-summary strong {
          color: var(--text-heading, #111827);
          font-size: 18px;
          overflow-wrap: anywhere;
        }

        .admin-details-status {
          padding: 8px 13px;
          border-radius: 25px;
          font-size: 13px !important;
        }

        .admin-details-section {
          margin-top: 30px;
        }

        .admin-details-section h3 {
          margin: 0 0 19px;
          padding-bottom: 13px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          color: var(--text-heading, #111827);
          font-size: 20px;
          font-weight: 750;
        }

        .admin-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .admin-detail-item {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 10px;
          padding: 19px 17px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          background: var(--surface-secondary, #f8fafc);
        }

        .admin-detail-item span {
          color: var(--text-secondary, #64748b);
          font-size: 14px;
          font-weight: 600;
        }

        .admin-detail-item strong {
          color: var(--text-primary, #172033);
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .admin-details-description {
          padding: 20px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          background: var(--surface-secondary, #f8fafc);
          color: var(--text-secondary, #475569);
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .admin-location-card {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 22px;
          border: 1px solid var(--border-color, #d6e5ff);
          border-radius: 14px;
          background: var(--surface-secondary, #eff6ff);
        }

        .admin-location-icon {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--card-bg, #dbeafe);
          color: var(--primary, #215cff);
          font-size: 25px;
        }

        .admin-location-content {
          min-width: 0;
        }

        .admin-location-content strong {
          color: var(--text-heading, #24499b);
          font-size: 16px;
          overflow-wrap: anywhere;
        }

        .admin-location-content p {
          margin: 12px 0 0;
          color: var(--text-secondary, #64748b);
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .admin-location-link {
          display: inline-block;
          margin-top: 19px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--primary, #215cff);
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .admin-history-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .admin-history-check {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--surface-secondary, #dbeafe);
          color: var(--primary, #215cff);
          font-size: 21px;
          font-weight: 800;
        }

        .admin-history-card {
          flex: 1;
          min-width: 0;
          padding: 18px 20px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 13px;
          background: var(--surface-secondary, #f8fafc);
        }

        .admin-history-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .admin-history-heading strong {
          color: var(--text-heading, #111827);
          font-size: 14px;
        }

        .admin-history-heading span {
          color: var(--text-muted, #64748b);
          font-size: 12px;
        }

        .admin-history-card p,
        .admin-discussion-card p {
          margin: 12px 0;
          color: var(--text-secondary, #475569);
          font-size: 14px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .admin-history-card small {
          color: var(--text-muted, #64748b);
          font-size: 12px;
        }

        .admin-no-comments {
          padding: 28px 18px;
          margin-bottom: 22px;
          border: 1px dashed var(--border-color, #cbd5e1);
          border-radius: 13px;
          color: var(--text-secondary, #64748b);
          text-align: center;
          font-size: 14px;
        }

        .admin-discussion-card {
          padding: 17px;
          margin-bottom: 12px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          background: var(--surface-secondary, #f8fafc);
        }

        .admin-comment-label {
          display: block;
          margin-bottom: 12px;
          color: var(--text-primary, #475569);
          font-size: 14px;
          font-weight: 650;
        }

        .admin-comment-input {
          display: block;
          width: 100%;
          min-height: 135px;
          padding: 16px;
          resize: vertical;
          border: 1px solid var(--input-border, #cbd5e1);
          border-radius: 12px;
          outline: none;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #111827);
          font: inherit;
          font-size: 14px;
          line-height: 1.7;
        }

        .admin-comment-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 13px;
        }

        .admin-comment-footer > span {
          color: var(--text-muted, #64748b);
          font-size: 12px;
        }

        .admin-details-footer {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 18px 34px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          background: var(--modal-bg, #fff);
        }

        .admin-details-primary,
        .admin-details-secondary {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .admin-details-primary {
          border: 1px solid var(--admin-accent);
          background: var(--admin-accent);
          color: #fff;
        }

        .admin-details-primary:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .admin-details-secondary {
          border: 1px solid var(--border-color, #cbd5e1);
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
        }

        .admin-status-modal {
          width: min(100%, 500px);
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 18px;
          background: var(--modal-bg, #fff);
          color: var(--text-primary, #172033);
          box-shadow: var(--modal-shadow, 0 25px 80px #0f172a40);
        }

        .admin-status-modal h2 {
          margin: 0 0 12px;
          color: var(--text-heading, #172033);
          font-size: 22px;
        }

        .admin-status-modal p {
          color: var(--text-secondary, #64748b);
          font-size: 14px;
          line-height: 1.6;
        }

        .admin-status-modal p strong {
          color: var(--text-primary, #172033);
        }

        .admin-status-label {
          display: block;
          margin: 18px 0 8px;
          color: var(--text-secondary, #475569);
          font-size: 13px;
          font-weight: 700;
        }

        .admin-status-select {
          width: 100%;
          min-height: 44px;
          padding: 10px;
          border: 1px solid var(--input-border, #cbd5e1);
          border-radius: 9px;
          background: var(--input-bg, #fff);
          color: var(--text-primary, #172033);
          font: inherit;
        }

        .admin-status-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        @media (max-width: 1100px) {
          .admin-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .admin-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-details-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-table {
            min-width: 850px;
          }
        }

        @media (max-width: 600px) {
          .admin-dashboard {
            padding: 15px;
          }

          .admin-stats {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .admin-stat {
            padding: 15px;
          }

          .admin-stat strong {
            font-size: 24px;
          }

          .admin-list-header {
            padding: 16px;
          }

          .admin-filters {
            padding: 14px 16px;
          }

          .admin-details-overlay {
            padding: 8px;
          }

          .admin-details-modal {
            height: 95vh;
            border-radius: 15px;
          }

          .admin-details-header {
            padding: 19px;
          }

          .admin-details-header h2 {
            font-size: 22px;
          }

          .admin-details-content {
            padding: 20px;
          }

          .admin-details-summary {
            grid-template-columns: 1fr;
            gap: 18px;
            padding: 18px;
          }

          .admin-details-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .admin-details-footer {
            padding: 13px 18px;
          }

          .admin-details-primary,
          .admin-details-secondary {
            padding: 0 13px;
            font-size: 12px;
          }

          .admin-location-card {
            padding: 15px;
          }

          .admin-status-modal {
            padding: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-dashboard *,
          .admin-dashboard *::before,
          .admin-dashboard *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* HEADER */}

      <header className="admin-topbar">
        <div className="admin-heading">
          <h1>Admin Dashboard</h1>
          <p>Manage campus complaints and monitor their progress.</p>
        </div>

        <div className="admin-top-actions">
          <NotificationBell dashboardPath="/admin-dashboard" />

          <button
            type="button"
            className="admin-button"
            onClick={fetchComplaints}
          >
            Refresh
          </button>

          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={handleExportPDF}
            disabled={filteredComplaints.length === 0}
          >
            Export PDF
          </button>
        </div>
      </header>

      {/* ERROR */}

      {error && (
        <div className="admin-error">
          {error}

          <button
            type="button"
            className="admin-button"
            style={{ marginLeft: 12 }}
            onClick={fetchComplaints}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <section className="admin-stats">
        <div className="admin-stat">
          <span>Total Complaints</span>
          <strong>{statistics.total}</strong>
        </div>

        <div className="admin-stat">
          <span>Pending</span>
          <strong>{statistics.pending}</strong>
        </div>

        <div className="admin-stat">
          <span>In Progress</span>
          <strong>{statistics.inProgress}</strong>
        </div>

        <div className="admin-stat">
          <span>Resolved</span>
          <strong>{statistics.resolved}</strong>
        </div>

        <div className="admin-stat">
          <span>Rejected</span>
          <strong>{statistics.rejected}</strong>
        </div>
      </section>

      {/* COMPLAINT MANAGEMENT */}

      <section className="admin-list-card">
        <div className="admin-list-header">
          <h2>Complaint Management</h2>

          <input
            className="admin-search"
            type="search"
            placeholder="Search complaints..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-filters">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`admin-filter ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-empty">Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="admin-empty">No complaints found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Submitted By</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((complaint) => {
                  const id = getComplaintId(complaint);
                  const status = complaint.status || "Pending";
                  const badge = getStatusStyle(status);

                  return (
                    <tr key={id}>
                      <td>
                        <strong className="admin-table-title">
                          {complaint.title || "Untitled Complaint"}
                        </strong>

                        <span className="admin-table-subtitle">
                          ID: {id || "N/A"}
                        </span>
                      </td>

                      {/* CORRECTED SUBMITTED BY COLUMN */}

                      <td>
                        <strong className="admin-submitted-name">
                          {getDisplayName(complaint)}
                        </strong>

                        <span className="admin-submitted-email">
                          {getDisplayEmail(complaint)}
                        </span>
                      </td>

                      <td>{complaint.category || "General"}</td>

                      <td>{complaint.priority || "Medium"}</td>

                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {status}
                        </span>
                      </td>

                      <td>{formatDate(complaint.createdAt)}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() => openDetails(complaint)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() => openStatusModal(complaint)}
                          >
                            Update
                          </button>

                          <button
                            type="button"
                            className="admin-small-button danger"
                            disabled={deletingId === id}
                            onClick={() => handleDelete(complaint)}
                          >
                            {deletingId === id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COMPLAINT DETAILS MODAL */}

      {showDetails && selectedComplaint && (
        <div
          className="admin-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div
            className="admin-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-details-title"
          >
            <header className="admin-details-header">
              <div>
                <p className="admin-details-eyebrow">
                  CAMPUS COMPLAINT DETAILS
                </p>

                <h2 id="admin-details-title">
                  {selectedComplaint.title || "Untitled Complaint"}
                </h2>

                <p className="admin-details-id">
                  Complaint ID: {getComplaintId(selectedComplaint) || "N/A"}
                </p>
              </div>

              <button
                type="button"
                className="admin-details-close-icon"
                onClick={closeDetails}
                aria-label="Close complaint details"
              >
                ×
              </button>
            </header>

            <div className="admin-details-content">
              <div className="admin-details-summary">
                <div>
                  <span>Current Status</span>

                  <strong
                    className="admin-details-status"
                    style={{
                      background: getStatusStyle(
                        selectedComplaint.status || "Pending"
                      ).bg,
                      color: getStatusStyle(
                        selectedComplaint.status || "Pending"
                      ).color,
                    }}
                  >
                    {selectedComplaint.status || "Pending"}
                  </strong>
                </div>

                <div>
                  <span>Priority</span>
                  <strong>{selectedComplaint.priority || "Medium"}</strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>{selectedComplaint.category || "General"}</strong>
                </div>
              </div>

              {/* COMPLAINT INFORMATION */}

              <section className="admin-details-section">
                <h3>Complaint Information</h3>

                <div className="admin-details-grid">
                  <DetailItem
                    label="Raised By"
                    value={getRaisedBy(selectedComplaint)}
                  />

                  <DetailItem
                    label="Submitted By"
                    value={getDisplayName(selectedComplaint)}
                  />

                  <DetailItem
                    label="Email Address"
                    value={getDisplayEmail(selectedComplaint)}
                  />

                  <DetailItem
                    label="Date Submitted"
                    value={formatDate(selectedComplaint.createdAt)}
                  />
                </div>
              </section>

              {/* DESCRIPTION */}

              <section className="admin-details-section">
                <h3>Description</h3>

                <div className="admin-details-description">
                  {selectedComplaint.description ||
                    "No description provided."}
                </div>
              </section>

              {/* LOCATION */}

              {(() => {
                const location = getLocation(selectedComplaint);

                if (
                  !location.address &&
                  location.latitude == null &&
                  location.longitude == null
                ) {
                  return null;
                }

                return (
                  <section className="admin-details-section">
                    <h3>Location</h3>

                    <div className="admin-location-card">
                      <div className="admin-location-icon">⌖</div>

                      <div className="admin-location-content">
                        <strong>
                          {location.address || "Complaint location"}
                        </strong>

                        {location.latitude != null && (
                          <p>Latitude: {location.latitude}</p>
                        )}

                        {location.longitude != null && (
                          <p>Longitude: {location.longitude}</p>
                        )}

                        <button
                          type="button"
                          className="admin-location-link"
                          onClick={() => openGoogleMaps(selectedComplaint)}
                        >
                          Open in Google Maps ↗
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* STATUS HISTORY */}

              <section className="admin-details-section">
                <h3>Status History</h3>

                {getHistory(selectedComplaint).length > 0 ? (
                  [...getHistory(selectedComplaint)]
                    .reverse()
                    .map((item, index) => (
                      <div
                        className="admin-history-item"
                        key={item.id || item._id || index}
                      >
                        <div className="admin-history-check">✓</div>

                        <div className="admin-history-card">
                          <div className="admin-history-heading">
                            <strong>
                              {item.status || "Status updated"}
                            </strong>

                            <span>
                              {formatDate(item.createdAt || item.updatedAt)}
                            </span>
                          </div>

                          <p>
                            {item.note ||
                              item.message ||
                              item.description ||
                              "Status updated"}
                          </p>

                          <small>
                            Updated by:{" "}
                            {item.updatedByName ||
                              item.updatedBy?.name ||
                              item.updatedBy?.email ||
                              item.userName ||
                              item.email ||
                              "System"}
                          </small>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="admin-history-item">
                    <div className="admin-history-check">✓</div>

                    <div className="admin-history-card">
                      <div className="admin-history-heading">
                        <strong>
                          {selectedComplaint.status || "Pending"}
                        </strong>

                        <span>
                          {formatDate(selectedComplaint.createdAt)}
                        </span>
                      </div>

                      <p>Complaint created</p>

                      <small>
                        Updated by: {getDisplayEmail(selectedComplaint)}
                      </small>
                    </div>
                  </div>
                )}
              </section>

              {/* COMMENTS */}

              <section className="admin-details-section">
                <h3>Comments &amp; Discussion</h3>

                {getComments(selectedComplaint).length === 0 ? (
                  <div className="admin-no-comments">
                    No comments yet. Start the discussion below.
                  </div>
                ) : (
                  getComments(selectedComplaint).map((comment, index) => (
                    <div
                      className="admin-discussion-card"
                      key={comment.id || comment._id || index}
                    >
                      <div className="admin-history-heading">
                        <strong>
                          {comment.userName ||
                            comment.name ||
                            comment.sender ||
                            comment.email ||
                            comment.role ||
                            "User"}
                        </strong>

                        <span>{formatDate(comment.createdAt)}</span>
                      </div>

                      <p>
                        {comment.comment ||
                          comment.message ||
                          comment.note ||
                          ""}
                      </p>
                    </div>
                  ))
                )}

                <form onSubmit={handleAddComment}>
                  <label
                    className="admin-comment-label"
                    htmlFor="admin-new-comment"
                  >
                    Add a comment
                  </label>

                  <textarea
                    id="admin-new-comment"
                    className="admin-comment-input"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Write a helpful update or response..."
                    maxLength={2000}
                    rows={5}
                    required
                  />

                  <div className="admin-comment-footer">
                    <span>{newComment.length}/2000 characters</span>

                    <button
                      type="submit"
                      className="admin-details-primary"
                      disabled={addingComment || !newComment.trim()}
                    >
                      {addingComment ? "Sending..." : "Send Comment"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <footer className="admin-details-footer">
              <button
                type="button"
                className="admin-details-secondary"
                onClick={closeDetails}
              >
                Close
              </button>

              <button
                type="button"
                className="admin-details-primary"
                onClick={() => openStatusModal(selectedComplaint)}
              >
                Update Status
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}

      {showStatusModal && selectedComplaint && (
        <div
          className="admin-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeStatusModal();
            }
          }}
        >
          <div
            className="admin-status-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-status-title"
          >
            <h2 id="admin-status-title">Update Complaint Status</h2>

            <p>
              Complaint:{" "}
              <strong>
                {selectedComplaint.title || "Untitled"}
              </strong>
            </p>

            <label className="admin-status-label" htmlFor="admin-status">
              New Status
            </label>

            <select
              id="admin-status"
              className="admin-status-select"
              value={statusToUpdate}
              onChange={(event) => setStatusToUpdate(event.target.value)}
              disabled={updatingStatus}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <label
              className="admin-status-label"
              htmlFor="admin-status-note"
            >
              Comment / Reason *
            </label>

            <textarea
              id="admin-status-note"
              className="admin-comment-input"
              rows={4}
              value={statusComment}
              onChange={(event) => setStatusComment(event.target.value)}
              placeholder="Enter the reason for this status update..."
              disabled={updatingStatus}
              required
            />

            <div className="admin-status-actions">
              <button
                type="button"
                className="admin-details-secondary"
                onClick={closeStatusModal}
                disabled={updatingStatus}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-details-primary"
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;