import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

import PendingUser from "../models/PendingUser.js";
import User from "../models/User.js";

import AppError from "../utils/AppError.js";
import { signAuthToken } from "../utils/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================
// CONFIGURATION
// ============================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_VERIFICATION_MESSAGE =
  "If an unverified account exists with that email, a verification link will be sent.";

// ============================================
// PUBLIC USER DATA
// ============================================

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

// ============================================
// EMAIL TRANSPORTER
// ============================================

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

// ============================================
// SEND VERIFICATION EMAIL
// ============================================

async function sendVerificationEmail(user, verificationToken) {
  const clientOrigin = process.env.CLIENT_ORIGIN;

  if (!clientOrigin) {
    throw new Error("CLIENT_ORIGIN is missing.");
  }

  const verificationUrl = `${clientOrigin}/verify-email?token=${verificationToken}`;

  const transporter = createMailTransporter();

  const info = await transporter.sendMail({
    from: `"StackRoast" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: "Verify your StackRoast email address",

    text: `Welcome to StackRoast!

Please verify your email address by opening this link:

${verificationUrl}

This link expires in 24 hours.

If you did not create this account, you can ignore this email.`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px">
        <h2>Welcome to StackRoast!</h2>

        <p>Please verify your email address.</p>

        <a
          href="${verificationUrl}"
          style="display:inline-block;padding:12px 20px;background:#f97316;color:white;text-decoration:none;border-radius:8px;font-weight:bold"
        >
          Verify Email Address
        </a>

        <p style="margin-top:20px">
          This link expires in 24 hours.
        </p>

        <p>
          If you did not create this account, ignore this email.
        </p>
      </div>
    `,
  });

  console.log("Verification email delivery result:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
}

// ============================================
// REGISTER
// ============================================

export const register = asyncHandler(async (req, res) => {
  const username =
    typeof req.body.username === "string" ? req.body.username.trim() : "";

  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  // Validate username
  if (username.length < 3 || username.length > 30) {
    throw new AppError("Username must be between 3 and 30 characters.", 400);
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new AppError(
      "Username can contain letters, numbers, dots, underscores, and hyphens.",
      400,
    );
  }

  // Validate email
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  // Validate password
  if (password.length < 8 || password.length > 128) {
    throw new AppError("Password must be between 8 and 128 characters.", 400);
  }

  // Check existing verified users
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  }).select("_id email username");

  if (existingUser) {
    throw new AppError(
      existingUser.email === email
        ? "That email is already registered."
        : "That username is already taken.",
      409,
    );
  }

  // Check existing pending registrations
  const existingPending = await PendingUser.findOne({
    $or: [{ email }, { username }],
  });

  if (existingPending) {
    if (existingPending.email !== email) {
      throw new AppError("That username is already taken.", 409);
    }

    throw new AppError(
      "Registration is already pending. Please request a new verification email.",
      409,
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Assign role
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const role = adminEmails.includes(email) ? "admin" : "user";

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Save only in PendingUser
  const pendingUser = await PendingUser.create({
    username,
    email,
    passwordHash,
    role,
    verificationToken: hashedToken,
    verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Send verification email
  try {
    await sendVerificationEmail(pendingUser, verificationToken);
  } catch (error) {
    console.error("Verification email error:", error);

    throw new AppError(
      "Registration is saved temporarily, but the verification email could not be sent. Please request another verification email.",
      503,
    );
  }

  res.status(201).json({
    message: "Registration successful. Please verify your email.",
    email: pendingUser.email,
  });
});

// ============================================
// VERIFY EMAIL + AUTOMATIC LOGIN
// ============================================

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token : "";

  if (!token || token.length !== 64) {
    throw new AppError("Invalid or expired verification link.", 400);
  }

  // Hash received token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find pending registration
  const pendingUser = await PendingUser.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: new Date() },
  }).select("+verificationToken");

  if (!pendingUser) {
    throw new AppError(
      "Invalid or expired verification link. Please request a new one.",
      400,
    );
  }

  // Check existing accounts
  const existingUser = await User.findOne({
    $or: [{ email: pendingUser.email }, { username: pendingUser.username }],
  });

  if (existingUser) {
    throw new AppError("This email or username is already registered.", 409);
  }

  // Create verified user
  const user = await User.create({
    username: pendingUser.username,
    email: pendingUser.email,
    passwordHash: pendingUser.passwordHash,
    role: pendingUser.role,
    isEmailVerified: true,
  });

  // Delete pending registration
  await PendingUser.deleteOne({
    _id: pendingUser._id,
  });

  // Generate JWT for automatic login
  const authToken = signAuthToken(user._id);

  // Return authentication details
  res.json({
    message: "Email verified successfully.",
    token: authToken,
    user: publicUser(user),
  });
});

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  const response = {
    message: GENERIC_VERIFICATION_MESSAGE,
  };

  const pendingUser = await PendingUser.findOne({
    email,
  });

  if (!pendingUser) {
    return res.json(response);
  }

  // Generate fresh token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  pendingUser.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  pendingUser.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pendingUser.save();

  try {
    await sendVerificationEmail(pendingUser, verificationToken);
  } catch (error) {
    console.error("Resend verification email error:", error);

    throw new AppError(
      "Unable to send the verification email. Please try again later.",
      503,
    );
  }

  return res.json(response);
});

// ============================================
// LOGIN - EMAIL VERIFICATION NOT REQUIRED
// ============================================

export const login = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({
    email,
  }).select("+passwordHash");

  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    throw new AppError("Email or password is incorrect.", 401);
  }

  res.json({
    token: signAuthToken(user._id),
    user: publicUser(user),
  });
});

// ============================================
// CURRENT USER
// ============================================

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: publicUser(req.user),
  });
});

// ============================================
// FORGOT PASSWORD
// ============================================

export const forgotPassword = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  // Verification is not required for password reset
  const user = await User.findOne({ email });

  const response = {
    message:
      "If an account exists with that email, a password-reset link will be sent.",
  };

  if (!user) {
    return res.json(response);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  const clientOrigin = process.env.CLIENT_ORIGIN;

  if (!clientOrigin) {
    throw new AppError("CLIENT_ORIGIN is missing.", 500);
  }

  const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

  try {
    const transporter = createMailTransporter();

    const info = await transporter.sendMail({
      from: `"StackRoast" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Reset your StackRoast password",

      text: `You requested a password reset.

Open this link to reset your password:

${resetUrl}

This link expires in 15 minutes.

If you did not request this, ignore this email.`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2>Reset your StackRoast password</h2>

          <p>You requested a password reset for your account.</p>

          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 20px;background:#f97316;color:white;text-decoration:none;border-radius:8px;font-weight:bold"
          >
            Reset Password
          </a>

          <p style="margin-top:20px">
            This link expires in 15 minutes.
          </p>

          <p>
            If you did not request this, ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Password reset email delivery result:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    console.error("Password reset email error:", error);

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

// ============================================
// RESET PASSWORD
// ============================================

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
