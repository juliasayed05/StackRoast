import mongoose from "mongoose";

export const FEEDBACK_TYPES = [
  "Brutal Roast",
  "Constructive Fix",
  "Security Warning",
  "Performance Tip",
];

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorHash: { type: String, required: true, select: false },
    isAnonymous: { type: Boolean, default: true },
    feedbackType: { type: String, enum: FEEDBACK_TYPES, required: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    codeSuggestion: { type: String, default: "", maxlength: 12000 },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model("Comment", commentSchema);
