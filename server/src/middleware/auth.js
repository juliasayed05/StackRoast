import User from "../models/User.js";
import { verifyAuthToken } from "../utils/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

// ============================================
// OPTIONAL AUTH
// ============================================

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = null;

  const token = getBearerToken(req);
  if (!token) return next();

  let payload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    // Public reads remain available with stale or malformed tokens.
    return next();
  }

  const user = await User.findById(payload.sub).select(
    "_id username email role isSuspended",
  );

  if (user?.isSuspended) {
    throw new AppError(
      "Your account has been suspended. Please contact StackRoast support.",
      403,
    );
  }

  if (user) {
    req.user = user;
  }

  next();
});

// ============================================
// REQUIRED AUTH
// ============================================

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new AppError("Authentication required. Please sign in.", 401);
  }

  let payload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new AppError(
      "Your session is invalid or has expired. Please sign in again.",
      401,
    );
  }

  const user = await User.findById(payload.sub).select(
    "_id username email role createdAt isSuspended",
  );

  if (!user) {
    throw new AppError(
      "Your account could not be found. Please sign in again.",
      401,
    );
  }

  // Block existing sessions belonging to suspended users.
  if (user.isSuspended) {
    throw new AppError(
      "Your account has been suspended. Please contact StackRoast support.",
      403,
    );
  }

  req.user = user;
  next();
});
