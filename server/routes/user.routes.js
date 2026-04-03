// ============================================================
// User Routes — Search, List, Profile, Update Avatar
// All routes are protected (require JWT)
// ============================================================

const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ─── GET ALL USERS (except logged-in user) ────────────────────
// GET /api/users
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ isOnline: -1, name: 1 }); // Online users first, then alphabetical

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users.",
    });
  }
});

// ─── SEARCH USERS ─────────────────────────────────────────────
// GET /api/users/search?q=query
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, users: [] });
    }

    // Search by name or email (case-insensitive)
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(20);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching users.",
    });
  }
});

// ─── GET USER PROFILE ────────────────────────────────────────
// GET /api/users/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user profile.",
    });
  }
});

// ─── UPDATE PROFILE ──────────────────────────────────────────
// PUT /api/users/profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile.",
    });
  }
});

module.exports = router;
