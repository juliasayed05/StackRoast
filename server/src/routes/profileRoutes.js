import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
} from "../controllers/profileController.js";

import { requireAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

// Protect all profile routes.
router.use(requireAuth);

// Get logged-in user's profile.
router.get("/me", getMyProfile);

// Update logged-in user's profile.
router.put("/me", updateMyProfile);

// Upload profile image to Cloudinary.
router.post("/image", upload.single("profileImage"), uploadProfileImage);

export default router;
