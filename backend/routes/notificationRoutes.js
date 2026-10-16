const express = require("express");

const router = express.Router();

const notificationController = require(
  "../controllers/notificationController"
);

const authMiddleware = require(
  "../middleware/authMiddleware"
);

// Get notifications
router.get(
  "/",
  authMiddleware,
  notificationController.getNotifications
);

// Mark all notifications as read
router.patch(
  "/read-all",
  authMiddleware,
  notificationController.markAllNotificationsAsRead
);

// Mark one notification as read
router.patch(
  "/:id/read",
  authMiddleware,
  notificationController.markNotificationAsRead
);

module.exports = router;