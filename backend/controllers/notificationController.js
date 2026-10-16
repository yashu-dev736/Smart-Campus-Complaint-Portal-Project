const { db } = require("../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");

const NOTIFICATIONS_COLLECTION = "notifications";

// Get authenticated user information
function getUserId(req) {
  return (
    req.user?.uid ||
    req.user?.id ||
    req.user?.userId ||
    req.user?._id ||
    null
  );
}

function getUserEmail(req) {
  return req.user?.email?.toLowerCase() || null;
}

function getUserRole(req) {
  return req.user?.role?.toLowerCase() ||
    req.user?.userRole?.toLowerCase() ||
    null;
}

// Convert Firestore timestamps to ISO strings
function formatTimestamp(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

// Format notification data
function formatNotification(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    ...data,
    read: Boolean(data.read),
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
    readAt: formatTimestamp(data.readAt),
  };
}

// Check whether the authenticated user can access a notification
function isRecipient(data, userId, email, role) {
  const recipientId =
    data.recipientId ||
    data.userId ||
    data.recipientUserId;

  const recipientEmail =
    data.recipientEmail ||
    data.userEmail;

  const recipientRole =
    data.recipientRole;

  const userMatches =
    userId &&
    recipientId &&
    String(userId) === String(recipientId);

  const emailMatches =
    email &&
    recipientEmail &&
    email === String(recipientEmail).toLowerCase();

  const roleMatches =
    role &&
    recipientRole &&
    role === String(recipientRole).toLowerCase();

  const broadcast =
    data.broadcast === true ||
    data.recipient === "all";

  return Boolean(
    userMatches ||
    emailMatches ||
    roleMatches ||
    broadcast
  );
}

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const userId = getUserId(req);
    const email = getUserEmail(req);
    const role = getUserRole(req);

    if (!userId && !email && !role) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user information is missing.",
      });
    }

    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .get();

    const notifications = snapshot.docs
      .filter((doc) =>
        isRecipient(
          doc.data() || {},
          userId,
          email,
          role
        )
      )
      .map(formatNotification)
      .sort((a, b) => {
        const timeA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const timeB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return timeB - timeA;
      });

    const unreadCount = notifications.filter(
      (notification) => !notification.read
    ).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("getNotifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
    });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;

    const userId = getUserId(req);
    const email = getUserEmail(req);
    const role = getUserRole(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required.",
      });
    }

    const notificationRef = db
      .collection(NOTIFICATIONS_COLLECTION)
      .doc(id);

    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const data = notificationDoc.data() || {};

    if (!isRecipient(data, userId, email, role)) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this notification.",
      });
    }

    const now = Timestamp.now();

    await notificationRef.update({
      read: true,
      readAt: now,
      updatedAt: now,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("markNotificationAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
}

// PATCH /api/notifications/read-all
async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = getUserId(req);
    const email = getUserEmail(req);
    const role = getUserRole(req);

    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .get();

    const unreadDocs = snapshot.docs.filter((doc) => {
      const data = doc.data() || {};

      return (
        !data.read &&
        isRecipient(data, userId, email, role)
      );
    });

    // Firestore batch writes support up to 500 operations.
    // Process smaller groups for safety.
    for (let i = 0; i < unreadDocs.length; i += 450) {
      const batch = db.batch();
      const chunk = unreadDocs.slice(i, i + 450);
      const now = Timestamp.now();

      chunk.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      updatedCount: unreadDocs.length,
    });
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
}

// Create a notification from another backend controller
async function createNotification(notification = {}) {
  const now = Timestamp.now();

  const payload = {
    title: notification.title || "New notification",
    message: notification.message || "",
    type: notification.type || "info",

    recipientId:
      notification.recipientId ||
      notification.userId ||
      null,

    recipientEmail:
      notification.recipientEmail ||
      notification.userEmail ||
      null,

    recipientRole:
      notification.recipientRole || null,

    complaintId:
      notification.complaintId || null,

    ...notification,

    read: false,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .add(payload);

  return {
    id: docRef.id,
    ...payload,
  };
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
};