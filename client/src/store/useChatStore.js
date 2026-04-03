// ============================================================
// Chat Store (Zustand)
// Manages chat state: conversations, messages, online users,
// typing indicators, selected chat, groups
// ============================================================

import { create } from "zustand";
import api from "../lib/api";

const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  messages: [],
  users: [],
  groups: [],
  selectedChat: null, // { type: 'user' | 'group', data: {...} }
  onlineUsers: [],
  typingUsers: {}, // { odId: { name, userId } }
  unreadCounts: {}, // { odId: count }
  isLoadingMessages: false,
  isLoadingUsers: false,

  // ─── Set selected chat ─────────────────────────────────────
  setSelectedChat: (chat) => {
    set({ selectedChat: chat, messages: [] });
  },

  // ─── Fetch all users ───────────────────────────────────────
  fetchUsers: async () => {
    try {
      set({ isLoadingUsers: true });
      const res = await api.get("/users");
      if (res.data.success) {
        set({ users: res.data.users, isLoadingUsers: false });
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      set({ isLoadingUsers: false });
    }
  },

  // ─── Search users ──────────────────────────────────────────
  searchUsers: async (query) => {
    try {
      if (!query.trim()) {
        // If empty query, fetch all users
        return get().fetchUsers();
      }
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (res.data.success) {
        set({ users: res.data.users });
      }
    } catch (error) {
      console.error("Search users error:", error);
    }
  },

  // ─── Fetch conversations list ──────────────────────────────
  fetchConversations: async () => {
    try {
      const res = await api.get("/messages/conversations/list");
      if (res.data.success) {
        set({ conversations: res.data.conversations });
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    }
  },

  // ─── Fetch messages for a 1-on-1 chat ─────────────────────
  fetchMessages: async (userId) => {
    try {
      set({ isLoadingMessages: true });
      const res = await api.get(`/messages/${userId}`);
      if (res.data.success) {
        set({ messages: res.data.messages, isLoadingMessages: false });
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
      set({ isLoadingMessages: false });
    }
  },

  // ─── Fetch group messages ──────────────────────────────────
  fetchGroupMessages: async (groupId) => {
    try {
      set({ isLoadingMessages: true });
      const res = await api.get(`/messages/group/${groupId}`);
      if (res.data.success) {
        set({ messages: res.data.messages, isLoadingMessages: false });
      }
    } catch (error) {
      console.error("Fetch group messages error:", error);
      set({ isLoadingMessages: false });
    }
  },

  // ─── Send a message ───────────────────────────────────────
  sendMessage: async (data) => {
    try {
      // Accessing auth state directly to get the current user for the preview
      const authUser = JSON.parse(localStorage.getItem("auth-storage"))?.state?.user;

      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        content: data.content,
        senderId: authUser || { _id: "me", name: "You" },
        receiverId: data.receiverId,
        type: data.type || "text",
        fileUrl: data.fileUrl,
        createdAt: new Date(),
        isOptimistic: true,
      };
      
      set((state) => ({ messages: [...state.messages, tempMessage] }));

      const res = await api.post("/messages/send", data);
      if (res.data.success) {
        // Wait for socket to handle adding the 'real' message
        // But remove the temp one immediately to prevent double-rendering
        set((state) => ({
          messages: state.messages.filter(m => m._id !== tempId)
        }));
        return res.data.message;
      }
    } catch (error) {
      console.error("Send message error:", error);
      return null;
    }
  },

  // ─── Send a group message ─────────────────────────────────
  sendGroupMessage: async (data) => {
    try {
      const authUser = JSON.parse(localStorage.getItem("auth-storage"))?.state?.user;
      
      const tempId = `temp-group-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        content: data.content,
        senderId: authUser || { _id: "me", name: "You" },
        groupId: data.groupId,
        type: data.type || "text",
        fileUrl: data.fileUrl,
        createdAt: new Date(),
        isOptimistic: true,
      };
      
      set((state) => ({ messages: [...state.messages, tempMessage] }));

      const res = await api.post("/messages/group/send", data);
      if (res.data.success) {
        set((state) => ({
          messages: state.messages.filter(m => m._id !== tempId)
        }));
        return res.data.message;
      }
    } catch (error) {
      console.error("Send group message error:", error);
      return null;
    }
  },

  // ─── Mark messages as read ─────────────────────────────────
  markAsRead: async (userId) => {
    try {
      await api.put(`/messages/read/${userId}`);
      // Clear unread count for this user
      set((state) => {
        const newCounts = { ...state.unreadCounts };
        delete newCounts[userId];
        return { unreadCounts: newCounts };
      });
    } catch (error) {
      console.error("Mark read error:", error);
    }
  },

  // ─── React to a message ───────────────────────────────────
  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await api.post(`/messages/react/${messageId}`, { emoji });
      if (res.data.success) {
        // Update the message in state
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId ? res.data.message : msg
          ),
        }));
      }
    } catch (error) {
      console.error("React error:", error);
    }
  },

  // ─── Add message to state (from socket) ───────────────────
  addMessage: (message) => {
    set((state) => {
      // Prevent duplicates
      const exists = state.messages.find((m) => m._id === message._id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  // ─── Update message (reactions, read receipts, deletions) ─────
  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg
      ),
    }));
  },

  // ─── Set online users ─────────────────────────────────────
  setOnlineUsers: (userIds) => {
    set({ onlineUsers: userIds });
  },

  // ─── Add online user ──────────────────────────────────────
  addOnlineUser: (userId) => {
    set((state) => {
      if (state.onlineUsers.includes(userId)) return state;
      return { onlineUsers: [...state.onlineUsers, userId] };
    });
  },

  // ─── Remove online user ───────────────────────────────────
  removeOnlineUser: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    }));
  },

  // ─── Set typing user ──────────────────────────────────────
  setTypingUser: (key, data) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [key]: data },
    }));
  },

  // ─── Remove typing user ───────────────────────────────────
  removeTypingUser: (key) => {
    set((state) => {
      const newTyping = { ...state.typingUsers };
      delete newTyping[key];
      return { typingUsers: newTyping };
    });
  },

  // ─── Increment unread count ────────────────────────────────
  incrementUnread: (userId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [userId]: (state.unreadCounts[userId] || 0) + 1,
      },
    }));
  },

  // ─── Update messages read status from socket ──────────────
  markMessagesReadInState: (senderId) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.senderId?._id === senderId || msg.senderId === senderId) {
          return msg;
        }
        // Messages sent by current user to this sender should be marked read
        return {
          ...msg,
          readBy: msg.readBy ? [...new Set([...msg.readBy, senderId])] : [senderId],
        };
      }),
    }));
  },

  // ─── Fetch groups ─────────────────────────────────────────
  fetchGroups: async () => {
    try {
      const res = await api.get("/groups");
      if (res.data.success) {
        set({ groups: res.data.groups });
      }
    } catch (error) {
      console.error("Fetch groups error:", error);
    }
  },

  // ─── Create group ─────────────────────────────────────────
  createGroup: async (data) => {
    try {
      const res = await api.post("/groups", data);
      if (res.data.success) {
        // We do NOT manually add to state here because 'addedToGroup' socket 
        // will handle it for all members including the admin.
        // This prevents double group creation in UI.
        return res.data.group;
      }
    } catch (error) {
      console.error("Create group error:", error);
      return null;
    }
  },

  // ─── Delete message ───────────────────────────────────────
  deleteMessage: async (messageId, forEveryone = false) => {
    try {
      const res = await api.delete(`/messages/${messageId}?forEveryone=${forEveryone}`);
      if (res.data.success) {
        if (forEveryone) {
          // If deleted for everyone, update the message locally to show the "Deleted" status
          set((state) => ({
            messages: state.messages.map((m) => 
              m._id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
            )
          }));
        } else {
          // If deleted for me, just remove it from local state
          set((state) => ({
            messages: state.messages.filter((msg) => msg._id !== messageId),
          }));
        }
        return true;
      }
    } catch (error) {
      console.error("Delete message error:", error);
      return false;
    }
  },

  // ─── Remove message from state (socket) ───────────────────
  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    }));
  },

  // ─── Add group (from socket event) ─────────────────────────
  addGroup: (group) => {
    set((state) => {
      const exists = state.groups.find((g) => g._id === group._id);
      if (exists) return state;
      return { groups: [group, ...state.groups] };
    });
  },

  // ─── markMessagesReadInState ───────────────────────────────
  markMessagesReadInState: (readBy) => {
    // Implement or ensure it matches App.jsx call signature
    set((state) => ({
      messages: state.messages.map((msg) => {
        return {
          ...msg,
          readBy: [...new Set([...(msg.readBy || []), ...readBy])],
        };
      }),
    }));
  },

  // ─── Leave group ──────────────────────────────────────────
  leaveGroup: async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/leave`);
      if (res.data.success) {
        // Remove from state
        get().removeGroup(groupId);
        // Deselect if it was the active chat
        if (get().selectedChat?.type === "group" && get().selectedChat.data._id === groupId) {
          set({ selectedChat: null, messages: [] });
        }
        return true;
      }
    } catch (error) {
      console.error("Leave group error:", error);
      return false;
    }
  },

  // ─── Remove group from state ──────────────────────────────
  removeGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
    }));
  },
}));

export default useChatStore;
