// ============================================================
// Socket.io Handler
// Manages real-time events: online status, typing indicators,
// message delivery, read receipts, and room management
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Group = require("../models/Group");

// Map of userId -> Set of socketIds (supports multiple tabs/devices)
const onlineUsers = new Map();

/**
 * Get the 1-on-1 chat room ID for two users
 * Room = sorted user ID pair joined by underscore
 */
const getChatRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};

/**
 * Initialize Socket.io event handlers
 */
const initializeSocket = (io) => {
  // ─── Authentication Middleware ────────────────────────────
  // Verify JWT token from handshake before allowing connection
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie
          ?.split("; ")
          .find((c) => c.startsWith("token="))
          ?.split("=")[1];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Invalid authentication token"));
    }
  });

  // ─── Connection Handler ──────────────────────────────────
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`🟢 User connected: ${socket.user.name} (${userId})`);

    // Track online user (support multiple connections per user)
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update user online status in database
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Join personal room for targeted notifications
    socket.join(`user_${userId}`);

    // Join all group rooms this user belongs to
    const userGroups = await Group.find({ members: userId });
    userGroups.forEach((group) => {
      socket.join(`group_${group._id}`);
    });

    // Broadcast online status to all connected clients
    io.emit("userOnline", {
      userId,
      isOnline: true,
    });

    // Send current online users list to newly connected client
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", onlineUserIds);

    // ─── Join Chat Room ──────────────────────────────────────
    // When user opens a conversation, join the specific chat room
    socket.on("joinChat", ({ otherUserId }) => {
      const roomId = getChatRoomId(userId, otherUserId);
      socket.join(roomId);
      console.log(`💬 ${socket.user.name} joined room: ${roomId}`);
    });

    // ─── Leave Chat Room ─────────────────────────────────────
    socket.on("leaveChat", ({ otherUserId }) => {
      const roomId = getChatRoomId(userId, otherUserId);
      socket.leave(roomId);
      console.log(`👋 ${socket.user.name} left room: ${roomId}`);
    });

    // ─── Join Group Room ─────────────────────────────────────
    socket.on("joinGroup", ({ groupId }) => {
      socket.join(`group_${groupId}`);
      console.log(`👥 ${socket.user.name} joined group: ${groupId}`);
    });

    // ─── Typing Indicator ────────────────────────────────────
    // Emit when user starts typing in a 1-on-1 chat
    socket.on("typing", ({ receiverId }) => {
      const roomId = getChatRoomId(userId, receiverId);
      socket.to(roomId).emit("userTyping", {
        userId,
        name: socket.user.name,
      });
    });

    // Emit when user stops typing
    socket.on("stopTyping", ({ receiverId }) => {
      const roomId = getChatRoomId(userId, receiverId);
      socket.to(roomId).emit("userStopTyping", {
        userId,
      });
    });

    // ─── Group Typing Indicator ──────────────────────────────
    socket.on("groupTyping", ({ groupId }) => {
      socket.to(`group_${groupId}`).emit("userTyping", {
        userId,
        name: socket.user.name,
        groupId,
      });
    });

    socket.on("groupStopTyping", ({ groupId }) => {
      socket.to(`group_${groupId}`).emit("userStopTyping", {
        userId,
        groupId,
      });
    });

    // ─── Send Message (via Socket for instant delivery) ──────
    socket.on("sendMessage", (messageData) => {
      const { receiverId } = messageData;
      const roomId = getChatRoomId(userId, receiverId);

      // Broadcast to the chat room (excluding sender)
      socket.to(roomId).emit("newMessage", messageData);

      // Also notify the receiver's personal room (for notification badge)
      socket.to(`user_${receiverId}`).emit("messageNotification", {
        senderId: userId,
        senderName: socket.user.name,
        senderAvatar: socket.user.avatar,
        content: messageData.content,
        type: messageData.type,
      });
    });

    // ─── Send Group Message ──────────────────────────────────
    socket.on("sendGroupMessage", (messageData) => {
      const { groupId } = messageData;
      socket
        .to(`group_${groupId}`)
        .emit("newGroupMessage", messageData);
    });

    // ─── Mark Messages as Read ───────────────────────────────
    socket.on("markRead", ({ senderId }) => {
      const roomId = getChatRoomId(userId, senderId);
      socket.to(roomId).emit("messagesRead", {
        readBy: userId,
        senderId,
      });
    });

    // ─── Reaction Updates ────────────────────────────────────
    socket.on("addReaction", (data) => {
      if (data.groupId) {
        socket
          .to(`group_${data.groupId}`)
          .emit("reactionUpdate", data);
      } else {
        const roomId = getChatRoomId(
          data.senderId,
          data.receiverId
        );
        socket.to(roomId).emit("reactionUpdate", data);
      }
    });

    // ─── Disconnect Handler ──────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(
        `🔴 User disconnected: ${socket.user.name} (${userId})`
      );

      // Remove this socket from the user's connections
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only mark offline if NO sockets remain (closed all tabs)
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Broadcast offline status
          io.emit("userOffline", {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }
      }
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
