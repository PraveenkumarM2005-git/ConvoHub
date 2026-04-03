// ============================================================
// Auth Routes — Register, Login, Logout, Check Auth
// Public: /register, /login
// Protected: /logout, /me
// ============================================================

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Helper: Generate JWT and set HTTP-only cookie
const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT token
    generateTokenAndSetCookie(user._id, res);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    generateTokenAndSetCookie(user._id, res);

    res.json({
      success: true,
      message: "Login successful.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────
// POST /api/auth/logout
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // Update user online status
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    // Clear the cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout.",
    });
  }
});

// ─── CHECK AUTH ───────────────────────────────────────────────
// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error checking authentication.",
    });
  }
});

module.exports = router;
