// ============================================================
// Message Model
// Schema: senderId, receiverId, content, type, reactions, readBy
// Supports text, image, and file message types
// ============================================================

const mongoose = require("mongoose");

// Sub-schema for emoji reactions on messages
const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for group messages
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null, // null for 1-on-1 messages
    },
    content: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    reactions: [reactionSchema],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient message queries between two users
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
