import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { signAuthToken } from '../utils/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    isAdmin: user.role === 'admin',
    createdAt: user.createdAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (username.length < 3 || username.length > 30) {
    throw new AppError('Username must be between 3 and 30 characters.', 400);
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new AppError('Username can contain letters, numbers, dots, underscores, and hyphens.', 400);
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new AppError('Please enter a valid email address.', 400);
  }
  if (password.length < 8 || password.length > 128) {
    throw new AppError('Password must be between 8 and 128 characters.', 400);
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] }).select('_id email username');
  if (existing) {
    throw new AppError(existing.email === email ? 'That email is already registered.' : 'That username is already taken.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  const role = adminEmails.includes(email) ? 'admin' : 'user';
  const user = await User.create({ username, email, passwordHash, role });
  res.status(201).json({ token: signAuthToken(user._id), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!passwordMatches) throw new AppError('Email or password is incorrect.', 401);

  res.json({ token: signAuthToken(user._id), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
