import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [users, posts, activePosts, expiredPosts, comments, resolvedPosts, recentPosts] = await Promise.all([
    User.countDocuments(), Post.countDocuments(), Post.countDocuments({ isExpired: false, expiresAt: { $gt: now } }),
    Post.countDocuments({ $or: [{ isExpired: true }, { expiresAt: { $lte: now } }] }),
    Comment.countDocuments(), Post.countDocuments({ isResolved: true }),
    Post.find().sort({ createdAt: -1 }).limit(8).select('title tags isAnonymous isResolved isExpired expiresAt createdAt authorId').populate('authorId', 'username email').lean(),
  ]);
  res.json({ stats: { users, posts, activePosts, expiredPosts, comments, resolvedPosts }, recentPosts: recentPosts.map((p) => ({ id: p._id, title: p.title, tags: p.tags, anonymous: p.isAnonymous, resolved: p.isResolved, expired: p.isExpired || p.expiresAt <= now, createdAt: p.createdAt, author: p.isAnonymous ? 'Anonymous Dev' : (p.authorId?.username || 'Deleted User') })) });
});

export const listAdminUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = 20;
  const [users, total] = await Promise.all([User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('username email role createdAt').lean(), User.countDocuments()]);
  res.json({ users: users.map((u) => ({ id: u._id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt })), total, page, pages: Math.ceil(total / limit) });
});

export const listAdminPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = 20;
  const [posts, total] = await Promise.all([Post.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('authorId', 'username email').lean(), Post.countDocuments()]);
  res.json({ posts: posts.map((p) => ({ id: p._id, title: p.title, description: p.description, isAnonymous: p.isAnonymous, isResolved: p.isResolved, isExpired: p.isExpired || p.expiresAt <= new Date(), expiresAt: p.expiresAt, createdAt: p.createdAt, author: p.isAnonymous ? 'Anonymous Dev' : (p.authorId?.username || 'Deleted User'), votes: p.upvotes?.length || 0 })), total, page, pages: Math.ceil(total / limit) });
});

export const removeAdminPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  await Promise.all([Comment.deleteMany({ postId: post._id }), post.deleteOne()]);
  res.json({ message: 'Post and its comments were removed.' });
});

export const toggleAdminResolve = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  post.isResolved = !post.isResolved; await post.save();
  res.json({ isResolved: post.isResolved });
});
