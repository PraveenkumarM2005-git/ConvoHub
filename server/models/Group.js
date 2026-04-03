// ============================================================
// Group Model
// Schema: name, members, admin, avatar, description
// Supports group chat functionality with admin controls
// ============================================================

const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: [2, "Group name must be at least 2 characters"],
      maxlength: [50, "Group name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    avatar: {
      type: String,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching user's groups
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
