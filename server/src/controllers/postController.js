import mongoose from 'mongoose';
import Post, { POST_TAGS, CODE_LANGUAGES } from '../models/Post.js';
import Comment, { FEEDBACK_TYPES } from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashUserId, matchesUserHash } from '../utils/ownerHash.js';

const EXPIRY_HOURS = { '1h': 1, '12h': 12, '24h': 24, '48h': 48 };
const SORTS = ['newest', 'top', 'expiring'];
const STATUSES = ['active', 'expired'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializePost(post, viewerId) {
  const author = post.authorData || post.authorId;
  const authorId = author?._id || post.authorId?._id || post.authorId;
  const isAnonymous = Boolean(post.isAnonymous);
  const username = author?.username || 'Deleted User';
  const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];

  return {
    id: post._id.toString(),
    title: post.title,
    description: post.description,
    codeSnippet: post.codeSnippet || '',
    codeLanguage: post.codeLanguage,
    liveUrl: post.liveUrl || null,
    tags: post.tags || [],
    isAnonymous,
    author: {
      label: isAnonymous ? 'Anonymous Dev' : `@${username}`,
      username: isAnonymous ? null : username,
    },
    isOwner: Boolean(viewerId && (matchesUserHash(post.authorHash, viewerId) || (authorId && viewerId.toString() === authorId.toString()))),
    isResolved: Boolean(post.isResolved),
    expiresAt: post.expiresAt,
    isExpired: Boolean(post.isExpired) || new Date(post.expiresAt).getTime() <= Date.now(),
    upvoteCount: typeof post.voteCount === 'number' ? post.voteCount : upvotes.length,
    hasUpvoted: Boolean(viewerId && upvotes.some((id) => id.toString() === viewerId.toString())),
    commentsCount: post.commentsCount ?? 0,
    createdAt: post.createdAt,
  };
}

function serializeComment(comment, viewerId) {
  const authorId = comment.authorId?._id || comment.authorId;
  const username = comment.authorId?.username || 'Deleted User';
  const isAnonymous = Boolean(comment.isAnonymous);
  const upvotes = comment.upvotes || [];
  return {
    id: comment._id.toString(),
    feedbackType: comment.feedbackType,
    content: comment.content,
    codeSuggestion: comment.codeSuggestion || '',
    isAnonymous,
    author: {
      label: isAnonymous ? 'Anonymous Dev' : `@${username}`,
      username: isAnonymous ? null : username,
    },
    isOwner: Boolean(viewerId && (matchesUserHash(post.authorHash, viewerId) || (authorId && viewerId.toString() === authorId.toString()))),
    upvoteCount: upvotes.length,
    hasUpvoted: Boolean(viewerId && upvotes.some((id) => id.toString() === viewerId.toString())),
    createdAt: comment.createdAt,
  };
}

export const listPosts = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const tag = typeof req.query.tag === 'string' ? req.query.tag : '';
  const sort = req.query.sort || 'newest';
  const status = req.query.status || 'active';

  if (!SORTS.includes(sort)) throw new AppError('Unsupported sort option.', 400);
  if (!STATUSES.includes(status)) throw new AppError('Unsupported post status.', 400);
  if (tag && tag !== 'all' && !POST_TAGS.includes(tag)) throw new AppError('Unsupported tag filter.', 400);

  const now = new Date();
  const match = status === 'active'
    ? { isExpired: false, expiresAt: { $gt: now } }
    : { $or: [{ isExpired: true }, { expiresAt: { $lte: now } }] };
  if (tag && tag !== 'all') match.tags = tag;
  if (search) {
    const term = new RegExp(escapeRegex(search), 'i');
    match.$and = [{ $or: [{ title: term }, { description: term }, { codeSnippet: term }] }];
  }

  const sortStage = sort === 'top'
    ? { voteCount: -1, createdAt: -1 }
    : sort === 'expiring'
      ? { expiresAt: 1, createdAt: -1 }
      : { createdAt: -1 };

  const posts = await Post.aggregate([
    { $match: match },
    { $addFields: { voteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
    { $sort: sortStage },
    { $limit: 100 },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'authorData',
        pipeline: [{ $project: { username: 1 } }],
      },
    },
    { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'comments',
        let: { currentPostId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$postId', '$$currentPostId'] } } },
          { $count: 'count' },
        ],
        as: 'commentMeta',
      },
    },
    { $addFields: { commentsCount: { $ifNull: [{ $arrayElemAt: ['$commentMeta.count', 0] }, 0] } } },
    { $project: { commentMeta: 0 } },
  ]);

  res.json({ posts: posts.map((post) => serializePost(post, req.user?._id)), count: posts.length });
});

export const getPost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Post not found.', 404);
  const post = await Post.findById(req.params.id).select('+authorHash').populate('authorId', 'username').lean();
  if (!post) throw new AppError('Post not found.', 404);

  const comments = await Comment.find({ postId: post._id })
    .populate('authorId', 'username')
    .sort({ createdAt: 1 })
    .lean();

  res.json({
    post: serializePost(post, req.user?._id),
    comments: comments.map((comment) => serializeComment(comment, req.user?._id)),
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const codeSnippet = typeof req.body.codeSnippet === 'string' ? req.body.codeSnippet : '';
  const codeLanguage = req.body.codeLanguage || 'javascript';
  const expiry = req.body.expiry || '24h';
  const tags = Array.isArray(req.body.tags) ? [...new Set(req.body.tags)] : [];
  const liveUrl = typeof req.body.liveUrl === 'string' ? req.body.liveUrl.trim() : '';

  if (!title || title.length > 120) throw new AppError('Title is required and must be 120 characters or fewer.', 400);
  if (!description || description.length > 5000) throw new AppError('Description is required and must be 5,000 characters or fewer.', 400);
  if (codeSnippet.length > 30000) throw new AppError('Code snippet must be 30,000 characters or fewer.', 400);
  if (!CODE_LANGUAGES.includes(codeLanguage)) throw new AppError('Choose a supported code language.', 400);
  if (!EXPIRY_HOURS[expiry]) throw new AppError('Choose a supported post lifespan.', 400);
  if (tags.some((item) => !POST_TAGS.includes(item))) throw new AppError('One or more selected tags are not supported.', 400);
  if (liveUrl) {
    try {
      const parsed = new URL(liveUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
    } catch {
      throw new AppError('Live URL must be a valid http or https URL.', 400);
    }
  }

  const expiresAt = new Date(Date.now() + EXPIRY_HOURS[expiry] * 60 * 60 * 1000);
  const post = await Post.create({
    title,
    description,
    codeSnippet,
    codeLanguage,
    liveUrl: liveUrl || undefined,
    tags,
    authorId: req.user._id,
    authorHash: hashUserId(req.user._id),
    isAnonymous: req.body.isAnonymous !== false,
    expiresAt,
  });

  const populated = await Post.findById(post._id).select('+authorHash').populate('authorId', 'username').lean();
  res.status(201).json({ post: serializePost(populated, req.user._id) });
});

export const togglePostUpvote = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('_id upvotes');
  if (!post) throw new AppError('Post not found.', 404);
  const alreadyVoted = post.upvotes.some((id) => id.equals(req.user._id));
  const updated = await Post.findByIdAndUpdate(
    post._id,
    alreadyVoted ? { $pull: { upvotes: req.user._id } } : { $addToSet: { upvotes: req.user._id } },
    { new: true },
  ).select('upvotes');
  res.json({ upvoteCount: updated.upvotes.length, hasUpvoted: !alreadyVoted });
});

export const toggleResolved = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('_id authorId authorHash isResolved');
  if (!post) throw new AppError('Post not found.', 404);
  if (!matchesUserHash(post.authorHash, req.user._id) && !post.authorId.equals(req.user._id)) throw new AppError('Only the post author can update its resolution.', 403);
  post.isResolved = !post.isResolved;
  await post.save();
  res.json({ isResolved: post.isResolved });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('_id authorId authorHash');
  if (!post) throw new AppError('Post not found.', 404);
  if (!matchesUserHash(post.authorHash, req.user._id) && !post.authorId.equals(req.user._id)) throw new AppError('Only the post author can delete it.', 403);
  await Comment.deleteMany({ postId: post._id });
  await post.deleteOne();
  res.json({ message: 'Post and its comments were deleted.' });
});

export const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('_id expiresAt isExpired');
  if (!post) throw new AppError('Post not found.', 404);
  if (post.isExpired || post.expiresAt <= new Date()) {
    if (!post.isExpired) {
      post.isExpired = true;
      await post.save();
    }
    throw new AppError('This roast has expired. Replies are locked.', 409);
  }

  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const feedbackType = req.body.feedbackType;
  const codeSuggestion = typeof req.body.codeSuggestion === 'string' ? req.body.codeSuggestion : '';
  if (!content || content.length > 3000) throw new AppError('Feedback is required and must be 3,000 characters or fewer.', 400);
  if (!FEEDBACK_TYPES.includes(feedbackType)) throw new AppError('Choose a valid feedback type.', 400);
  if (codeSuggestion.length > 12000) throw new AppError('Code suggestion must be 12,000 characters or fewer.', 400);

  const comment = await Comment.create({
    postId: post._id,
    authorId: req.user._id,
    authorHash: hashUserId(req.user._id),
    isAnonymous: req.body.isAnonymous !== false,
    feedbackType,
    content,
    codeSuggestion,
  });
  const populated = await Comment.findById(comment._id).populate('authorId', 'username').lean();
  res.status(201).json({ comment: serializeComment(populated, req.user._id) });
});
