import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

const PROFILE_FIELDS = [
  "displayName",
  "bio",
  "profileImage",
  "location",
  "jobTitle",
  "website",
  "portfolioUrl",
  "githubUrl",
  "linkedinUrl",
  "skills",
  "experienceLevel",
];

const URL_FIELDS = [
  "profileImage",
  "website",
  "portfolioUrl",
  "githubUrl",
  "linkedinUrl",
];

const EXPERIENCE_LEVELS = [
  "",
  "beginner",
  "intermediate",
  "advanced",
  "professional",
];

function isValidHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getProfileData(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName || "",
    bio: user.bio || "",
    profileImage: user.profileImage || "",
    location: user.location || "",
    jobTitle: user.jobTitle || "",
    website: user.website || "",
    portfolioUrl: user.portfolioUrl || "",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    skills: user.skills || [],
    experienceLevel: user.experienceLevel || "",
    createdAt: user.createdAt,
  };
}

// GET /api/profile/me
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  res.status(200).json({
    profile: getProfileData(user),
  });
});

// PUT /api/profile/me
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  const updates = {};

  // Only allow approved profile fields.
  for (const field of PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  }

  // Validate URLs.
  for (const field of URL_FIELDS) {
    const value = updates[field];

    if (value !== undefined) {
      if (typeof value !== "string" || !isValidHttpUrl(value.trim())) {
        throw new AppError(
          `${field} must be a valid URL starting with http:// or https://.`,
          400,
        );
      }

      updates[field] = value.trim();
    }
  }

  // Validate text fields.
  const stringFields = ["displayName", "bio", "location", "jobTitle"];

  for (const field of stringFields) {
    if (updates[field] !== undefined) {
      if (typeof updates[field] !== "string") {
        throw new AppError(`${field} must be text.`, 400);
      }

      updates[field] = updates[field].trim();
    }
  }

  if (updates.displayName?.length > 60) {
    throw new AppError("Display name cannot exceed 60 characters.", 400);
  }

  if (updates.bio?.length > 500) {
    throw new AppError("Bio cannot exceed 500 characters.", 400);
  }

  if (updates.location?.length > 100) {
    throw new AppError("Location cannot exceed 100 characters.", 400);
  }

  if (updates.jobTitle?.length > 100) {
    throw new AppError("Job title cannot exceed 100 characters.", 400);
  }

  // Validate skills.
  if (updates.skills !== undefined) {
    if (
      !Array.isArray(updates.skills) ||
      updates.skills.length > 20 ||
      updates.skills.some(
        (skill) =>
          typeof skill !== "string" ||
          skill.trim().length === 0 ||
          skill.trim().length > 40,
      )
    ) {
      throw new AppError(
        "Skills must be a list of up to 20 text items, each 1–40 characters.",
        400,
      );
    }

    // Remove duplicate skills.
    updates.skills = [
      ...new Map(
        updates.skills.map((skill) => [
          skill.trim().toLowerCase(),
          skill.trim(),
        ]),
      ).values(),
    ];
  }

  // Validate experience level.
  if (updates.experienceLevel !== undefined) {
    if (
      typeof updates.experienceLevel !== "string" ||
      !EXPERIENCE_LEVELS.includes(updates.experienceLevel)
    ) {
      throw new AppError("Please select a valid experience level.", 400);
    }
  }

  Object.assign(user, updates);

  await user.save();

  res.status(200).json({
    message: "Profile updated successfully.",
    profile: getProfileData(user),
  });
});

// POST /api/profile/image
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please select an image to upload.", 400);
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError("Cloudinary is not configured on the server.", 500);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  // Upload image to Cloudinary.
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "stackroast/profile-images",
        public_id: `user-${user._id}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 600,
            height: 600,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, uploadResult) => {
        if (error) {
          return reject(error);
        }

        resolve(uploadResult);
      },
    );

    uploadStream.end(req.file.buffer);
  });

  // Save Cloudinary URL in MongoDB.
  user.profileImage = result.secure_url;

  await user.save();

  res.status(200).json({
    message: "Profile image uploaded successfully.",
    profileImage: user.profileImage,
    profile: getProfileData(user),
  });
});
