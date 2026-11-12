import User from '../models/User.js';
import { verifyAuthToken } from '../utils/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = null;
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub).select('_id username email role');
    if (user) req.user = user;
  } catch {
    // Public reads remain available when a stale or malformed token is supplied.
  }
  next();
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) throw new AppError('Authentication required. Please sign in.', 401);

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new AppError('Your session is invalid or has expired. Please sign in again.', 401);
  }

  const user = await User.findById(payload.sub).select('_id username email role createdAt');
  if (!user) throw new AppError('Your account could not be found. Please sign in again.', 401);
  req.user = user;
  next();
});
