import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { signAuthToken } from "../utils/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
    isAdmin: user.role === "admin",
    createdAt: user.createdAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const username =
    typeof req.body.username === "string" ? req.body.username.trim() : "";
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (username.length < 3 || username.length > 30) {
    throw new AppError("Username must be between 3 and 30 characters.", 400);
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new AppError(
      "Username can contain letters, numbers, dots, underscores, and hyphens.",
      400,
    );
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new AppError("Please enter a valid email address.", 400);
  }
  if (password.length < 8 || password.length > 128) {
    throw new AppError("Password must be between 8 and 128 characters.", 400);
  }

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  }).select("_id email username");
  if (existing) {
    throw new AppError(
      existing.email === email
        ? "That email is already registered."
        : "That username is already taken.",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const role = adminEmails.includes(email) ? "admin" : "user";
  const user = await User.create({ username, email, passwordHash, role });
  res
    .status(201)
    .json({ token: signAuthToken(user._id), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password)
    throw new AppError("Email and password are required.", 400);

  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;
  if (!passwordMatches)
    throw new AppError("Email or password is incorrect.", 401);

  res.json({ token: signAuthToken(user._id), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

function createMailTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email configuration is missing.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS.replace(/\s/g, ""),
    },
  });
}

// Request password reset
export const forgotPassword = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  const user = await User.findOne({ email });

  // Always return the same response to avoid revealing registered emails.
  const response = {
    message:
      "If an account exists with that email, a password-reset link will be sent.",
  };

  if (!user) {
    return res.json(response);
  }

  // Generate a secure random token.
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store only the hashed token.
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;

  try {
    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: `"StackRoast" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Reset your StackRoast password",
      text: `You requested a password reset.

Open this link to reset your password:
${resetUrl}

This link expires in 15 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2>Reset your StackRoast password</h2>
          <p>You requested a password reset for your account.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#f97316;color:white;text-decoration:none;border-radius:8px;font-weight:bold">
            Reset Password
          </a>
          <p style="margin-top:20px">This link expires in 15 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    // Invalidate the token if email delivery fails.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    throw new AppError(
      "Unable to send the reset email. Please try again later.",
      503,
    );
  }

  res.json(response);
});

// Reset password using the emailed token
export const resetPassword = asyncHandler(async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!token || token.length !== 64) {
    throw new AppError("Invalid or expired password-reset link.", 400);
  }

  if (password.length < 8 || password.length > 128) {
    throw new AppError("Password must be between 8 and 128 characters.", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordHash +passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError("Invalid or expired password-reset link.", 400);
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();

  await user.save();

  res.json({
    message:
      "Password reset successful. You can now sign in with your new password.",
  });
});
