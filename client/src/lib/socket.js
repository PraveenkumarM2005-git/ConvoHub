// ============================================================
// Socket.io Client Setup
// Connects to the backend Socket.io server with auth token
// ============================================================

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

/**
 * Initialize socket connection with authentication
 * Called after user logs in successfully
 */
export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = () => socket;

/**
 * Disconnect socket — called on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };
