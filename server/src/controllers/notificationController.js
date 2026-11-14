import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================
// GET NOTIFICATIONS
// ============================================

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
  );

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipientId: req.user._id })
      .populate("actorId", "username")
      .populate("postId", "title")
      .populate("commentId", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Notification.countDocuments({
      recipientId: req.user._id,
    }),

    Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    }),
  ]);

  const formattedNotifications = notifications.map((notification) => ({
    id: notification._id.toString(),
    type: notification.type,

    actor: notification.actorIsAnonymous
      ? { label: "Anonymous Dev", username: null }
      : {
          label: notification.actorId?.username
            ? `@${notification.actorId.username}`
            : "Deleted User",
          username: notification.actorId?.username || null,
        },

    actorIsAnonymous: notification.actorIsAnonymous,

    post: notification.postId
      ? {
          id: notification.postId._id.toString(),
          title: notification.postId.title,
        }
      : null,

    comment: notification.commentId
      ? {
          id: notification.commentId._id.toString(),
          content: notification.commentId.content,
        }
      : null,

    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }));

  res.json({
    notifications: formattedNotifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total,
    },
    unreadCount,
  });
});

// ============================================
// GET UNREAD COUNT
// ============================================

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipientId: req.user._id,
    isRead: false,
  });

  res.json({ unreadCount });
});

// ============================================
// MARK ONE NOTIFICATION AS READ
// ============================================

export const markNotificationRead = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError("Notification not found.", 404);
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipientId: req.user._id,
    },
    {
      $set: { isRead: true },
    },
    { new: true },
  );

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  res.json({
    message: "Notification marked as read.",
    notificationId: notification._id,
    isRead: notification.isRead,
  });
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    {
      recipientId: req.user._id,
      isRead: false,
    },
    {
      $set: { isRead: true },
    },
  );

  res.json({
    message: "All notifications marked as read.",
    modifiedCount: result.modifiedCount,
  });
});

// ============================================
// DELETE NOTIFICATION
// ============================================

export const deleteNotification = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError("Notification not found.", 404);
  }

  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientId: req.user._id,
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  res.json({
    message: "Notification deleted successfully.",
  });
});
