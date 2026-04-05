const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

const smtpPort = Number(process.env.SMTP_PORT || 587);
const hasMailConfig = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

const mailTransporter = hasMailConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const getClientBaseUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }

  const origins = String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (origins[0] || "http://localhost:5173").replace(/\/$/, "");
};

const sendResetEmail = async ({ to, resetUrl }) => {
  if (!mailTransporter) {
    return false;
  }

  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
  await mailTransporter.sendMail({
    from: fromAddress,
    to,
    subject: "Serenity password reset",
    text: `Reset your password using this link: ${resetUrl}\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2 style="margin-bottom: 8px;">Reset your Serenity password</h2>
        <p>Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="font-size: 13px; color: #666;">This link expires in 30 minutes.</p>
      </div>
    `,
  });

  return true;
};

// Multer config for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
      return cb(new Error("Only JPG, JPEG, PNG files allowed."));
    }
    cb(null, true);
  },
});

// Register
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let profileImagePath = "";
    if (req.file) {
      profileImagePath = "/uploads/" + req.file.filename;
    }
    const user = new User({
      name,
      email,
      hashedPassword,
      profileImage: profileImagePath,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login failed." });
  }
});

// Forgot password (request reset token)
router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return generic response to prevent email enumeration.
      return res.json({ message: "If an account exists, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetUrl = `${getClientBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
    let emailSent = false;
    try {
      emailSent = await sendResetEmail({ to: user.email, resetUrl });
    } catch (mailErr) {
      console.error("Failed to send reset email:", mailErr?.message || mailErr);
    }

    const response = { message: "If an account exists, a reset link has been sent." };
    if (!emailSent && process.env.NODE_ENV !== "production") {
      response.message = "Email service is not configured. Use development reset link below.";
      response.resetToken = rawToken;
      response.resetUrl = resetUrl;
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to process forgot password." });
  }
});

// Reset password using token
router.post("/reset-password", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token, password and confirm password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired." });
    }

    user.hashedPassword = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password updated successfully. Please login." });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to reset password." });
  }
});

module.exports = router;
