import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

import {
  dashboardStats,
  listAdminUsers,
  listAdminPosts,
  removeAdminPost,
  toggleAdminResolve,
  deleteAdminUser,
  toggleAdminUserSuspension,
} from "../controllers/adminController.js";

const router = Router();

// Protect all admin routes.
router.use(requireAuth, requireAdmin);

// Dashboard
router.get("/dashboard", dashboardStats);

// User management
router.get("/users", listAdminUsers);
router.patch("/users/:id/suspension", toggleAdminUserSuspension);
router.delete("/users/:id", deleteAdminUser);

// Post management
router.get("/posts", listAdminPosts);
router.delete("/posts/:id", removeAdminPost);
router.patch("/posts/:id/resolve", toggleAdminResolve);

export default router;
