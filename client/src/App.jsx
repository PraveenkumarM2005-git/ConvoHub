// ============================================================
// App.jsx — Root Component
// Handles routing, auth checking, theme init, and socket events
// ============================================================

import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/useAuthStore";
import useChatStore from "./store/useChatStore";
import useThemeStore from "./store/useThemeStore";
import { getSocket } from "./lib/socket";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setTypingUser,
    removeTypingUser,
    incrementUnread,
    markMessagesReadInState,
    addGroup,
    removeGroup,
    removeMessage,
    selectedChat,
    fetchConversations,
  } = useChatStore();
  const { initTheme } = useThemeStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    initTheme();
  }, [checkAuth, initTheme]);

  // Set up socket event listeners when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // ─── Online status events ─────────────────────────────
    socket.on("onlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on("userOnline", ({ userId }) => {
      addOnlineUser(userId);
    });

    socket.on("userOffline", ({ userId }) => {
      removeOnlineUser(userId);
    });

    // ─── New message event ────────────────────────────────
    socket.on("newMessage", (message) => {
      const senderId = message.senderId?._id || message.senderId;

      // Add message if the chat is currently open
      if (selectedChat?.type === "user") {
        const otherUserId = selectedChat.data._id;
        const receiverId = message.receiverId?._id || message.receiverId;
        
        // Show if this message is FROM the other user to me
        // OR sent BY me to the other user
        if (senderId === otherUserId || (senderId === user._id && receiverId === otherUserId)) {
          addMessage(message);
        } else if (senderId !== user._id) {
          incrementUnread(senderId);
        }
      } else if (senderId !== user._id) {
        // Increment unread count for this sender if no chat is open
        incrementUnread(senderId);
      }

      // Refresh conversation list
      fetchConversations();

      // Browser notification if tab is not focused
      if (document.hidden) {
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {
          // Audio play failed silently
        }

        if (Notification.permission === "granted") {
          const senderName = message.senderId?.name || "Someone";
          new Notification("ConvoHub", {
            body:
              message.type === "image"
                ? `📷 ${senderName} sent an image`
                : message.type === "file"
                ? `📎 ${senderName} sent a file`
                : `${senderName}: ${message.content}`,
          });
        }
      }
    });

    // ─── New group message event ──────────────────────────
    socket.on("newGroupMessage", (message) => {
      if (
        selectedChat?.type === "group" &&
        selectedChat.data._id ===
          (message.groupId?._id || message.groupId)
      ) {
        addMessage(message);
      }
    });

    // ─── Typing events ───────────────────────────────────
    socket.on("userTyping", ({ userId, name, groupId }) => {
      const key = groupId || userId;
      setTypingUser(key, { userId, name });
    });

    socket.on("userStopTyping", ({ userId, groupId }) => {
      const key = groupId || userId;
      removeTypingUser(key);
    });

    // ─── Message deletion event ─────────────────────────
    socket.on("messageDeleted", ({ messageId, status }) => {
      if (status === 'deleted') {
         // Keep the message but update its status so we show "Message Deleted"
         updateMessage({ _id: messageId, isDeleted: true, content: "This message was deleted" });
      } else {
         removeMessage(messageId);
      }
    });

    // ─── Read receipts ───────────────────────────────────
    socket.on("messagesRead", ({ readBy }) => {
      markMessagesReadInState(readBy);
    });

    // ─── Reaction updates ────────────────────────────────
    socket.on("reactionUpdate", (updatedMessage) => {
      updateMessage(updatedMessage);
    });

    // ─── Group events ────────────────────────────────────
    socket.on("addedToGroup", (group) => {
      addGroup(group);
      socket.emit("joinGroup", { groupId: group._id });
    });

    socket.on("memberLeft", ({ groupId, userId }) => {
      // If it's the current user who left (from another tab)
      if (userId === user._id) {
        removeGroup(groupId);
        if (selectedChat?.type === "group" && selectedChat.data._id === groupId) {
           useChatStore.getState().setSelectedChat(null);
        }
      } else {
        // Someone else left, update the group in our list if needed
        // For simplicity, we could just re-fetch groups or update the member list
        // Let's just refresh group list to be safe and simple
        useChatStore.getState().fetchGroups();
      }
    });

    // ─── Message notification (for badge updates) ────────
    socket.on("messageNotification", ({ senderId }) => {
      if (
        !selectedChat ||
        selectedChat.type !== "user" ||
        selectedChat.data._id !== senderId
      ) {
        incrementUnread(senderId);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("onlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("newMessage");
      socket.off("newGroupMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messagesRead");
      socket.off("readReceipts");
      socket.off("messageDeleted");
      socket.off("reactionUpdate");
      socket.off("addedToGroup");
      socket.off("memberLeft");
      socket.off("messageNotification");
    };
  }, [isAuthenticated, selectedChat]);

  // Request browser notification permission
  useEffect(() => {
    if (isAuthenticated && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-100 text-sm tracking-widest uppercase">
            Initializing ConvoHub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1a1b24",
            color: "#c4c5d0",
            border: "1px solid #2a2b38",
            borderRadius: "12px",
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <ChatPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
