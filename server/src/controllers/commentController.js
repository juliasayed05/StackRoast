import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleCommentUpvote = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).select(
    "_id authorId postId isAnonymous upvotes",
  );

  if (!comment) {
    throw new AppError("Feedback not found.", 404);
  }

  const alreadyVoted = comment.upvotes.some((id) => id.equals(req.user._id));

  const updated = await Comment.findByIdAndUpdate(
    comment._id,
    alreadyVoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } },
    { new: true },
  ).select("upvotes");

  // Notify the comment author only when a new upvote is added.
  // Do not notify users about their own actions.
  if (
    !alreadyVoted &&
    comment.authorId &&
    !comment.authorId.equals(req.user._id)
  ) {
    try {
      await Notification.create({
        recipientId: comment.authorId,
        actorId: req.user._id,
        type: "comment_upvote",
        postId: comment.postId,
        commentId: comment._id,
        actorIsAnonymous: comment.isAnonymous,
      });
    } catch (error) {
      // Notification failure should not break the upvote feature.
      console.error("Comment upvote notification failed:", error);
    }
  }

  res.json({
    upvoteCount: updated.upvotes.length,
    hasUpvoted: !alreadyVoted,
  });
});
