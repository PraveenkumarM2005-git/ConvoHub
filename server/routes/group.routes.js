// ============================================================
// Group Routes — Create, Update, Join, Leave, List
// All routes are protected (require JWT)
// ============================================================

const express = require("express");
const Group = require("../models/Group");
const Message = require("../models/Message");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ─── CREATE GROUP ─────────────────────────────────────────────
// POST /api/groups
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required.",
      });
    }

    if (!members || members.length < 1) {
      return res.status(400).json({
        success: false,
        message: "At least one member is required besides the admin.",
      });
    }

    // Include admin in members list
    const allMembers = [...new Set([adminId.toString(), ...members])];

    const group = await Group.create({
      name,
      description: description || "",
      admin: adminId,
      members: allMembers,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "name avatar")
      .populate("members", "name avatar isOnline lastSeen");

    // Notify all members via socket to join the group room
    allMembers.forEach((memberId) => {
      req.io.to(`user_${memberId}`).emit("addedToGroup", populatedGroup);
    });

    res.status(201).json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating group.",
    });
  }
});

// ─── GET USER'S GROUPS ────────────────────────────────────────
// GET /api/groups
router.get("/", verifyToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("admin", "name avatar")
      .populate("members", "name avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching groups.",
    });
  }
});

// ─── GET GROUP BY ID ──────────────────────────────────────────
// GET /api/groups/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name avatar")
      .populate("members", "name avatar isOnline lastSeen");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching group.",
    });
  }
});

// ─── UPDATE GROUP ─────────────────────────────────────────────
// PUT /api/groups/:id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Only admin can update
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the group admin can update the group.",
      });
    }

    const { name, description, avatar } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar) group.avatar = avatar;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("admin", "name avatar")
      .populate("members", "name avatar isOnline lastSeen");

    req.io.to(`group_${group._id}`).emit("groupUpdated", updatedGroup);

    res.json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating group.",
    });
  }
});

// ─── ADD MEMBERS TO GROUP ─────────────────────────────────────
// POST /api/groups/:id/members
router.post("/:id/members", verifyToken, async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the group admin can add members.",
      });
    }

    // Add new members (avoid duplicates)
    const newMembers = members.filter(
      (m) => !group.members.map((gm) => gm.toString()).includes(m)
    );

    group.members.push(...newMembers);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("admin", "name avatar")
      .populate("members", "name avatar isOnline lastSeen");

    // Notify new members
    newMembers.forEach((memberId) => {
      req.io.to(`user_${memberId}`).emit("addedToGroup", updatedGroup);
    });

    req.io.to(`group_${group._id}`).emit("groupUpdated", updatedGroup);

    res.json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Add members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding members.",
    });
  }
});

// ─── LEAVE GROUP ──────────────────────────────────────────────
// POST /api/groups/:id/leave
router.post("/:id/leave", verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    // Remove user from members
    group.members = group.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );

    // If admin leaves, assign new admin to first remaining member
    if (group.admin.toString() === req.user._id.toString()) {
      if (group.members.length > 0) {
        group.admin = group.members[0];
      } else {
        // No members left — delete group
        await Group.findByIdAndDelete(group._id);
        return res.json({
          success: true,
          message: "Group deleted (no members remaining).",
        });
      }
    }

    await group.save();

    req.io.to(`group_${group._id}`).emit("memberLeft", {
      groupId: group._id,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: "Left the group successfully.",
    });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error leaving group.",
    });
  }
});

module.exports = router;
