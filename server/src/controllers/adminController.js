import mongoose from "mongoose";

import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================
// DASHBOARD STATISTICS
// ============================================

export const dashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();

  const [
    users,
    posts,
    activePosts,
    expiredPosts,
    comments,
    resolvedPosts,
    recentPosts,
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Post.countDocuments({
      isExpired: false,
      expiresAt: { $gt: now },
    }),
    Post.countDocuments({
      $or: [{ isExpired: true }, { expiresAt: { $lte: now } }],
    }),
    Comment.countDocuments(),
    Post.countDocuments({ isResolved: true }),
    Post.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "title tags isAnonymous isResolved isExpired expiresAt createdAt authorId",
      )
      .populate("authorId", "username email")
      .lean(),
  ]);

  res.json({
    stats: {
      users,
      posts,
      activePosts,
      expiredPosts,
      comments,
      resolvedPosts,
    },

    recentPosts: recentPosts.map((p) => ({
      id: p._id,
      title: p.title,
      tags: p.tags,
      anonymous: p.isAnonymous,
      resolved: p.isResolved,
      expired: p.isExpired || p.expiresAt <= now,
      createdAt: p.createdAt,
      author: p.isAnonymous
        ? "Anonymous Dev"
        : p.authorId?.username || "Deleted User",
    })),
  });
});

// ============================================
// LIST USERS
// ============================================

// ============================================
// LIST USERS
// ============================================

export const listAdminUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = 20;
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "all").toLowerCase();

  const filter = {};

  // Filter by account status
  if (status === "active") {
    filter.isSuspended = { $ne: true };
  } else if (status === "suspended") {
    filter.isSuspended = true;
  } else if (status !== "all") {
    throw new AppError("Invalid user status filter.", 400);
  }

  // Search by username, email, or display name
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { username: regex },
      { email: regex },
      { displayName: regex },
    ];
  }

  const total = await User.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const users = await User.find(filter)
    .select("username email role createdAt displayName isSuspended suspendedAt")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "user",
      displayName: user.displayName || "",
      createdAt: user.createdAt,
      isSuspended: user.isSuspended || false,
      suspendedAt: user.suspendedAt || null,
    })),
    page,
    pages,
    total,
  });
});
// ============================================
// DELETE USER
// ============================================

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Validate MongoDB ID.
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid user ID.", 400);
  }

  // Prevent admin from deleting their own account.
  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot delete your own admin account.", 403);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Prevent deletion of other administrators.
  if (user.role === "admin") {
    throw new AppError("You cannot delete another admin account.", 403);
  }

  // Delete only the user account.
  // Existing posts and comments are preserved.
  await user.deleteOne();

  res.status(200).json({
    message:
      "User account deleted successfully. Posts and comments were preserved.",
    deletedUserId: userId,
  });
});

// ============================================
// LIST POSTS
// ============================================

export const listAdminPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = 20;
  const now = new Date();
  const status = String(req.query.status || "all");

  const filter = {};

  if (status === "active") {
    filter.isExpired = { $ne: true };
    filter.expiresAt = { $gt: now };
  } else if (status === "expired") {
    filter.$or = [{ isExpired: true }, { expiresAt: { $lte: now } }];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("authorId", "username email")
      .lean(),

    Post.countDocuments(filter),
  ]);

  res.json({
    posts: posts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      codeSnippet: p.codeSnippet || "",
      codeLanguage: p.codeLanguage || "javascript",
      liveUrl: p.liveUrl || "",
      tags: p.tags || [],
      isAnonymous: p.isAnonymous,
      isResolved: p.isResolved,
      isExpired: p.isExpired || new Date(p.expiresAt) <= now,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
      author: p.isAnonymous
        ? "Anonymous Dev"
        : p.authorId?.username || "Deleted User",
      votes: p.upvotes?.length || 0,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ============================================
// DELETE POST
// ============================================

export const removeAdminPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError("Post not found.", 404);
  }

  await Promise.all([
    Comment.deleteMany({ postId: post._id }),
    post.deleteOne(),
  ]);

  res.json({
    message: "Post and its comments were removed.",
  });
});

// ============================================
// RESOLVE / UNRESOLVE POST
// ============================================

export const toggleAdminResolve = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError("Post not found.", 404);
  }

  post.isResolved = !post.isResolved;

  await post.save();

  res.json({
    isResolved: post.isResolved,
  });
});

// ============================================
// SUSPEND / UNSUSPEND USER
// ============================================

export const toggleAdminUserSuspension = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { suspended } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid user ID.", 400);
  }

  if (typeof suspended !== "boolean") {
    throw new AppError("Suspension status must be true or false.", 400);
  }

  if (String(req.user._id) === String(userId)) {
    throw new AppError("You cannot suspend your own account.", 403);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.role === "admin") {
    throw new AppError("You cannot suspend another admin.", 403);
  }

  user.isSuspended = suspended;
  user.suspendedAt = suspended ? new Date() : null;

  await user.save();

  res.json({
    message: suspended
      ? "User suspended successfully. All user data has been preserved."
      : "User access restored successfully.",
    user: {
      id: user._id.toString(),
      username: user.username,
      isSuspended: user.isSuspended,
      suspendedAt: user.suspendedAt,
    },
  });
});
