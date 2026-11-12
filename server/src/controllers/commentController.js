import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const toggleCommentUpvote = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).select('_id upvotes');
  if (!comment) throw new AppError('Feedback not found.', 404);
  const alreadyVoted = comment.upvotes.some((id) => id.equals(req.user._id));
  const updated = await Comment.findByIdAndUpdate(
    comment._id,
    alreadyVoted ? { $pull: { upvotes: req.user._id } } : { $addToSet: { upvotes: req.user._id } },
    { new: true },
  ).select('upvotes');
  res.json({ upvoteCount: updated.upvotes.length, hasUpvoted: !alreadyVoted });
});
