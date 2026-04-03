// ============================================================
// Sidebar Component
// User/group search, conversation list, profile section
// ============================================================

import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import useThemeStore from "../store/useThemeStore";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuthStore();
  const { toggleTheme, theme } = useThemeStore();
  const {
    conversations,
    fetchConversations,
    users,
    searchUsers,
    setSelectedChat,
    selectedChat,
    onlineUsers,
    typingUsers,
    unreadCounts,
    markAsRead,
    groups,
    fetchGroups,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState("chats"); // 'chats', 'contacts', 'groups'
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchConversations();
    searchUsers("");
    fetchGroups();
  }, []);

  // Handle search input with naive debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === "contacts") {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, activeTab]);

  const handleSelectChat = (item, type) => {
    setSelectedChat({ type, data: item });
    if (type === "user" && unreadCounts[item._id]) {
      markAsRead(item._id);
    }
  };

  const renderContacts = () => {
    return users.map((u) => (
      <div
        key={u._id}
        onClick={() => handleSelectChat(u, "user")}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent 
        ${
          selectedChat?.data?._id === u._id && selectedChat?.type === "user"
            ? "bg-dark-600 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            : "hover:bg-dark-700"
        }`}
      >
        <div className="relative">
          {u.avatar ? (
            <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-dark-500 flex items-center justify-center text-dark-50 font-medium">
              {u.name.charAt(0).toUpperCase()}
            </div>
          )}
          {onlineUsers.includes(u._id) && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-dark-900"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-dark-50 truncate">{u.name}</h4>
          </div>
          <p className="text-sm text-dark-200 truncate">{u.email}</p>
        </div>
      </div>
    ));
  };

  const renderConversations = () => {
    if (conversations.length === 0) {
      return (
        <div className="text-center py-8 text-dark-300 text-sm">
          No active conversations. Start a new chat from Contacts.
        </div>
      );
    }

    return conversations.map((conv) => {
      const isOnline = onlineUsers.includes(conv._id._id);
      const isTyping = typingUsers[conv._id._id];
      const selected =
        selectedChat?.type === "user" && selectedChat?.data?._id === conv._id._id;

      let lastMsgContent = "Draft...";
      if (conv.lastMessage?.type === "image") lastMsgContent = "📷 Image";
      else if (conv.lastMessage?.type === "file") lastMsgContent = "📎 File";
      else lastMsgContent = conv.lastMessage?.content;

      // Handle message sent by me
      if (conv.lastMessage?.senderId === user._id) {
        lastMsgContent = `You: ${lastMsgContent}`;
      }

      return (
        <div
          key={conv._id._id}
          onClick={() => handleSelectChat(conv._id, "user")}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent
          ${selected ? "bg-dark-600 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]" : "hover:bg-dark-700"}`}
        >
          <div className="relative">
            {conv._id.avatar ? (
              <img
                src={conv._id.avatar}
                alt={conv._id.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-dark-500 flex items-center justify-center text-dark-50 font-medium">
                {conv._id.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-dark-900"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-semibold text-dark-50 truncate">
                {conv._id.name}
              </h4>
               {typingUsers[conv._id._id] ? (
                  <span className="text-xs text-purple-400 font-medium italic">typing...</span>
                ) : (
                  <span className="text-xs text-dark-300">
                    {conv.lastMessage?.createdAt &&
                      new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                )}
            </div>
            
            <p className="text-sm text-dark-200 truncate">
              {lastMsgContent}
            </p>
          </div>
          {unreadCounts[conv._id._id] > 0 && (
            <div className="bg-purple-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCounts[conv._id._id]}
            </div>
          )}
        </div>
      );
    });
  };

  const renderGroups = () => {
     if (groups.length === 0) {
      return (
        <div className="text-center py-8 text-dark-300 text-sm">
          No groups yet. Click the + icon to create one!
        </div>
      );
    }
    return groups.map((g) => {
        const selected = selectedChat?.type === 'group' && selectedChat?.data?._id === g._id;
        const typingInfo = typingUsers[g._id];
        
        return (
            <div
                key={g._id}
                onClick={() => handleSelectChat(g, 'group')}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent
                ${selected ? "bg-dark-600 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]" : "hover:bg-dark-700"}`}
                >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-medium border border-purple-500/30">
                     #
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-dark-50 truncate">{g.name}</h4>
                        {typingInfo && (
                            <span className="text-xs text-purple-400 font-medium italic truncate w-16 text-right">
                                {typingInfo.name} typing...
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-dark-200 truncate">
                        {g.members.length} members
                    </p>
                </div>
            </div>
        )
    });
  };

  return (
    <div className="h-full flex flex-col pt-4">
      {/* Header Profile */}
      <div className="px-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
             {user?.avatar ? (
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-dark-600" alt="avatar" />
             ) : (
                <div className="w-10 h-10 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-50 font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
             )}
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-500 rounded-full border-2 border-dark-900 outline-2 outline-dark-900"></div>
          </div>
          <div>
            <h2 className="font-bold text-dark-50 leading-tight">{user?.name}</h2>
            <p className="text-xs text-cyan-500 uppercase tracking-wider font-medium">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-dark-200 hover:text-dark-50 hover:bg-dark-800 transition-colors"
                title="Toggle Theme"
            >
                {theme === "dark" ? (
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                 </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
            </button>
            <button
            onClick={logout}
            className="p-2 rounded-lg text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Disconnect"
            >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            </button>
            <button className="md:hidden p-2 text-dark-200 hover:text-dark-50" onClick={onClose}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-2 mb-4">
        {[
          { id: "chats", label: "Chats" },
          { id: "contacts", label: "Contacts" },
          { id: "groups", label: "Groups" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-dark-800 text-dark-50 shadow-sm border border-dark-600"
                : "text-dark-200 hover:text-dark-100 hover:bg-dark-800/50"
            }`}
          >
            {tab.label}
            {tab.id === 'groups' && (
                <div 
                    title="Start New Group"
                    className="p-0.5 hover:bg-dark-600 rounded transition-colors group/add"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsGroupModalOpen(true);
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-purple-400 group-hover/add:text-purple-300">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {(activeTab === "contacts" || activeTab === "groups") && (
        <div className="px-5 mb-4 relative">
            <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2 pl-10 pr-4 text-sm text-dark-50 placeholder-dark-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
            <svg className="absolute left-8 top-1/2 -translate-y-1/2 text-dark-300 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </div>
      )}

      {/* List Container */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scroll-smooth">
        <div className="space-y-1">
            {activeTab === "chats" && renderConversations()}
            {activeTab === "contacts" && renderContacts()}
            {activeTab === "groups" && renderGroups()}
        </div>
      </div>

      <CreateGroupModal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
      />
    </div>
  );
};

export default Sidebar;
