import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    verificationToken: {
      type: String,
      required: true,
    },

    verificationExpires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "pendingusers",
  },
);

pendingUserSchema.index({ email: 1 }, { unique: true });
pendingUserSchema.index({ username: 1 }, { unique: true });
pendingUserSchema.index({ verificationExpires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingUser", pendingUserSchema);
