import express from "express";

import { requireAuth } from "../middleware/auth.js";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification endpoints require authentication.
router.use(requireAuth);

// GET /api/notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/read-all
router.patch("/read-all", markAllNotificationsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markNotificationRead);

// DELETE /api/notifications/:id
router.delete("/:id", deleteNotification);

export default router;
