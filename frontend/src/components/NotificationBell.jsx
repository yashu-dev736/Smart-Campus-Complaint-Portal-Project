import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://smart-campus-complaint-portal-project.onrender.com/api"
).replace(/\/+$/, "");
function getToken() {
  return (
    localStorage.getItem("scc_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell({
  onOpenComplaint,
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rootRef = useRef(null);

  const request = useCallback(
    async (path, options = {}) => {
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
            ...(options.headers || {}),
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // The response may not contain JSON.
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Request failed (${response.status})`
        );
      }

      return data;
    },
    []
  );

  const loadNotifications = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await request("/notifications");

        const items = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications(items);

        setUnreadCount(
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : items.filter((item) => !item.read).length
        );

        setError("");
      } catch (err) {
        setError(
          err.message || "Unable to load notifications."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [request]
  );

  // Initial load and automatic refresh
  useEffect(() => {
    loadNotifications(true);

    const timer = window.setInterval(() => {
      loadNotifications(false);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  // Close the panel when clicking outside or pressing Escape
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  async function markOneRead(item) {
    if (item.read) {
      return;
    }

    try {
      await request(
        `/notifications/${encodeURIComponent(item.id)}/read`,
        {
          method: "PATCH",
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark notification as read."
      );
    }
  }

  async function markAllRead() {
    try {
      await request("/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark all notifications as read."
      );
    }
  }

  async function handleNotificationClick(item) {
    await markOneRead(item);

    setOpen(false);

    if (
      item.complaintId &&
      typeof onOpenComplaint === "function"
    ) {
      onOpenComplaint(item.complaintId);
    }
  }

  return (
    <div ref={rootRef} style={styles.root}>
      <button
        type="button"
        aria-label={`Notifications${
          unreadCount
            ? `, ${unreadCount} unread`
            : ""
        }`}
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open;

          setOpen(nextOpen);

          if (nextOpen) {
            loadNotifications(true);
          }
        }}
        style={styles.bellButton}
      >
        <span aria-hidden="true" style={styles.bellIcon}>
          ♧
        </span>

        <span>Notifications</span>

        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          style={styles.panel}
          aria-label="Notifications panel"
        >
          <header style={styles.header}>
            <div>
              <h3 style={styles.heading}>
                Notifications
              </h3>

              <p style={styles.subheading}>
                {unreadCount
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div style={styles.headerActions}>
              <button
                type="button"
                onClick={() => loadNotifications(true)}
                style={styles.iconButton}
                title="Refresh"
              >
                ↻
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={styles.iconButton}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>

          {unreadCount > 0 && (
            <div style={styles.markAllRow}>
              <button
                type="button"
                onClick={markAllRead}
                style={styles.markAllButton}
              >
                Mark all as read
              </button>
            </div>
          )}

          {error && (
            <div role="alert" style={styles.error}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={styles.state}>
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>♧</div>

              <strong>No notifications yet</strong>

              <span style={styles.emptyText}>
                New updates will appear here.
              </span>
            </div>
          ) : (
            <div style={styles.list}>
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(item)
                  }
                  style={{
                    ...styles.item,
                    ...(item.read
                      ? styles.readItem
                      : styles.unreadItem),
                  }}
                >
                  <span style={styles.itemDot}>
                    {item.read ? "○" : "●"}
                  </span>

                  <span style={styles.itemContent}>
                    <span style={styles.itemTitle}>
                      {item.title || "Notification"}
                    </span>

                    <span style={styles.itemMessage}>
                      {item.message ||
                        "You have a new update."}
                    </span>

                    <span style={styles.itemTime}>
                      {formatTime(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <footer style={styles.footer}>
            <span>
              Smart Campus Complaint Portal
            </span>

            <button
              type="button"
              onClick={() => loadNotifications(true)}
              style={styles.footerButton}
            >
              Refresh
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}

const styles = {
  root: {
    position: "relative",
    display: "inline-flex",
    fontFamily:
      "Inter, system-ui, -apple-system, sans-serif",
    zIndex: 1000,
  },

  bellButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 13px",
    border: "1px solid #dbeafe",
    borderRadius: 12,
    background: "#fff",
    color: "#1e3a8a",
    cursor: "pointer",
    fontWeight: 650,
    boxShadow: "0 2px 8px rgba(15,23,42,.05)",
  },

  bellIcon: {
    fontSize: 20,
    lineHeight: 1,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 19,
    height: 19,
    padding: "0 5px",
    borderRadius: 999,
    background: "#2563eb",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
  },

  panel: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: "min(390px, calc(100vw - 28px))",
    maxHeight: 540,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    background: "#fff",
    boxShadow: "0 22px 55px rgba(15,23,42,.2)",
    color: "#0f172a",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "17px 18px 13px",
    borderBottom: "1px solid #f1f5f9",
  },

  heading: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
  },

  subheading: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#64748b",
  },

  headerActions: {
    display: "flex",
    gap: 6,
  },

  iconButton: {
    width: 31,
    height: 31,
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    background: "#fff",
    color: "#334155",
    fontSize: 20,
    cursor: "pointer",
  },

  markAllRow: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 16px 2px",
  },

  markAllButton: {
    border: 0,
    background: "transparent",
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  error: {
    margin: "8px 12px",
    padding: 10,
    borderRadius: 9,
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
  },

  state: {
    padding: 30,
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "35px 20px",
    color: "#334155",
    fontSize: 13,
  },

  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 44,
    height: 44,
    borderRadius: 15,
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: 24,
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 12,
  },

  list: {
    maxHeight: 360,
    overflowY: "auto",
  },

  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    padding: "13px 16px",
    border: 0,
    borderBottom: "1px solid #f1f5f9",
    textAlign: "left",
    cursor: "pointer",
    color: "#0f172a",
  },

  unreadItem: {
    background: "#eff6ff",
  },

  readItem: {
    background: "#fff",
  },

  itemDot: {
    marginTop: 2,
    color: "#2563eb",
    fontSize: 12,
  },

  itemContent: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
  },

  itemTitle: {
    fontSize: 13,
    fontWeight: 750,
  },

  itemMessage: {
    fontSize: 12,
    lineHeight: 1.45,
    color: "#475569",
    overflowWrap: "anywhere",
  },

  itemTime: {
    fontSize: 10,
    color: "#94a3b8",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderTop: "1px solid #f1f5f9",
    color: "#94a3b8",
    fontSize: 10,
  },

  footerButton: {
    border: 0,
    background: "transparent",
    color: "#2563eb",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  },
};