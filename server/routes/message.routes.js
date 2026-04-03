// ============================================================
// Message Routes — Send, Get History, Mark Read, React
// All routes are protected (require JWT)
// ============================================================

const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ─── SEND MESSAGE (1-on-1) ────────────────────────────────────
// POST /api/messages/send
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { receiverId, content, type, fileUrl, fileName, fileSize } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required.",
      });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required.",
      });
    }

    // Create the message
    const message = await Message.create({
      senderId,
      receiverId,
      content: content || "",
      type: type || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      readBy: [senderId], // Sender has read their own message
    });

    // Populate sender info for the response
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar");

    // Emit via Socket.io — room = sorted user IDs
    const roomId = [senderId.toString(), receiverId]
      .sort()
      .join("_");
    req.io.to(roomId).emit("newMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending message.",
    });
  }
});

// ─── SEND GROUP MESSAGE ───────────────────────────────────────
// POST /api/messages/group/send
router.post("/group/send", verifyToken, async (req, res) => {
  try {
    const { groupId, content, type, fileUrl, fileName, fileSize } = req.body;
    const senderId = req.user._id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required.",
      });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required.",
      });
    }

    const message = await Message.create({
      senderId,
      groupId,
      content: content || "",
      type: type || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      readBy: [senderId],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name avatar")
      .populate("groupId", "name");

    // Emit to group room
    req.io.to(`group_${groupId}`).emit("newGroupMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send group message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending group message.",
    });
  }
});

// ─── GET CHAT HISTORY (1-on-1) ────────────────────────────────
// GET /api/messages/:userId
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const myId = req.user._id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar")
      .populate("reactions.userId", "name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Message.countDocuments({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching messages.",
    });
  }
});

// ─── GET GROUP CHAT HISTORY ───────────────────────────────────
// GET /api/messages/group/:groupId
router.get("/group/:groupId", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ groupId: req.params.groupId })
      .populate("senderId", "name avatar")
      .populate("reactions.userId", "name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      groupId: req.params.groupId,
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get group messages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching group messages.",
    });
  }
});

// ─── MARK MESSAGES AS READ ────────────────────────────────────
// PUT /api/messages/read/:userId
router.put("/read/:userId", verifyToken, async (req, res) => {
  try {
    const myId = req.user._id;
    const senderId = req.params.userId;

    // Mark all unread messages from sender as read
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: myId,
        readBy: { $nin: [myId] },
      },
      {
        $addToSet: { readBy: myId },
      }
    );

    // Notify sender that messages were read via socket
    // Fix: Join by underscore to match getChatRoomId logic
    const roomId = [myId.toString(), senderId.toString()].sort().join("_");
    req.io.to(roomId).emit("messagesRead", {
      readBy: myId,
      senderId: senderId,
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read.`,
    });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking messages as read.",
    });
  }
});

// ─── ADD REACTION TO MESSAGE ──────────────────────────────────
// POST /api/messages/react/:messageId
router.post("/react/:messageId", verifyToken, async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user._id;
    const messageId = req.params.messageId;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required.",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    // Check if user already reacted with this emoji — toggle off
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove the reaction (toggle off)
      message.reactions = message.reactions.filter(
        (r) =>
          !(r.userId.toString() === userId.toString() && r.emoji === emoji)
      );
    } else {
      // Add the reaction
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar")
      .populate("reactions.userId", "name avatar");

    // Emit reaction update to the relevant room
    if (message.groupId) {
      req.io
        .to(`group_${message.groupId}`)
        .emit("reactionUpdate", updatedMessage);
    } else {
      const roomId = [message.senderId.toString(), message.receiverId.toString()]
        .sort()
        .join("_");
      req.io.to(roomId).emit("reactionUpdate", updatedMessage);
    }

    res.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("React to message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reaction.",
    });
  }
});

// ─── GET CONVERSATIONS LIST ──────────────────────────────────
// GET /api/messages/conversations/list
router.get("/conversations/list", verifyToken, async (req, res) => {
  try {
    const myId = req.user._id;

    // Aggregate to get last message with each user
    const conversations = await Message.aggregate([
      {
        $match: {
          groupId: null,
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", myId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$senderId", myId] },
                    { $not: { $in: [myId, "$readBy"] } },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // Populate user info
    const populatedConversations = await User.populate(conversations, {
      path: "_id",
      select: "name avatar isOnline lastSeen",
    });

    res.json({
      success: true,
      conversations: populatedConversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching conversations.",
    });
  }
});

// ─── DELETE MESSAGE ──────────────────────────────────────────
// DELETE /api/messages/:messageId
router.delete("/:messageId", verifyToken, async (req, res) => {
  try {
    const { forEveryone } = req.query;
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (forEveryone === "true") {
      const isSender = message.senderId.toString() === userId.toString();
      if (!isSender) {
        return res.status(403).json({ success: false, message: "Only the sender can delete for everyone." });
      }

      // Update message instead of deleting, so we can show "This message was deleted"
      message.content = "This message was deleted";
      message.type = "text";
      message.fileUrl = "";
      message.fileName = "";
      message.fileSize = 0;
      message.isDeleted = true; // Flag for UI
      await message.save();

      // Notify all relevant users
      if (message.groupId) {
        req.io.to(`group_${message.groupId}`).emit("messageDeleted", { messageId, status: "deleted" });
      } else {
        const roomId = [message.senderId.toString(), message.receiverId.toString()].sort().join("_");
        req.io.to(roomId).emit("messageDeleted", { messageId, status: "deleted" });
      }

      return res.json({ success: true, message: "Deleted for everyone." });
    } else {
      // Delete for me (actually remove from DB for this user's perspective)
      await Message.findByIdAndDelete(messageId);
      res.json({ success: true, message: "Deleted for you." });
    }
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ success: false, message: "Server error deleting message." });
  }
});

module.exports = router;
