import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Account information
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Profile information
    displayName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    githubUrl: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 20,
        message: "You can add up to 20 skills.",
      },
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "professional", ""],
      default: "",
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // User role
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

export default mongoose.model("User", userSchema);
