// ============================================================
// ChatPage — Main Interface Layout
// Contains the Sidebar and ChatWindow
// Matches the reference UI layout
// ============================================================

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import useChatStore from "../store/useChatStore";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { selectedChat } = useChatStore();

  // Close sidebar on mobile when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  }, [selectedChat]);

  return (
    <div className="flex h-[100dvh] w-full bg-dark-950 overflow-hidden">
      {/* Sidebar - responsive behavior */}
      <div 
        className={`w-full md:w-[320px] lg:w-[380px] h-full flex-shrink-0 transition-transform duration-300 ease-in-out absolute md:relative z-20 bg-dark-900 border-r border-dark-600
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full flex flex-col relative bg-dark-950">
        {/* Mobile sidebar toggle button when chat is open */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-3 left-3 z-30 p-1.5 rounded-lg bg-dark-800 border border-dark-600 shadow-lg text-dark-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatPage;
