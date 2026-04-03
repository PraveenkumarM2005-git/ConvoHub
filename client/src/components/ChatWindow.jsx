import { useEffect, useRef, useState } from "react";
import useChatStore from "../store/useChatStore";
import useThemeStore from "../store/useThemeStore";
import { getSocket } from "../lib/socket";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import GroupInfoModal from "./GroupInfoModal";
import GroupOptionsModal from "./GroupOptionsModal";
import { format } from "date-fns";

const ChatWindow = () => {
  const {
    selectedChat,
    messages,
    isLoadingMessages,
    fetchMessages,
    fetchGroupMessages,
    typingUsers,
    onlineUsers,
  } = useChatStore();

  const { chatBackground } = useThemeStore();

  const messagesEndRef = useRef(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isGroupOptionsOpen, setIsGroupOptionsOpen] = useState(false);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages, typingUsers, isLoadingMessages]);

  useEffect(() => {
    if (!selectedChat) return;
    setIsGroupInfoOpen(false);
    setIsGroupOptionsOpen(false);

    const socket = getSocket();
    if (selectedChat.type === "group") {
        fetchGroupMessages(selectedChat.data._id);
        socket.emit("joinGroup", { groupId: selectedChat.data._id });
    } else {
        fetchMessages(selectedChat.data._id);
        socket.emit("joinChat", { otherUserId: selectedChat.data._id });
    }

    return () => {
        if (selectedChat.type === "group") socket.emit("leaveGroup", { groupId: selectedChat.data._id });
        else socket.emit("leaveChat", { otherUserId: selectedChat.data._id });
    };
  }, [selectedChat]);

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-950 px-6 text-center">
         <div className="w-24 h-24 rounded-3xl mb-8 flex items-center justify-center relative bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600 shadow-xl">
             <div className="absolute inset-0 rounded-3xl opacity-20 bg-[radial-gradient(circle_at_center,var(--color-purple-500)_0%,transparent_70%)] blur-md"></div>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple-500)" strokeWidth="1.5">
                 <path d="M22 12A10 10 0 1 0 12 22a10 10 0 0 0 10-10Z" /><path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
             </svg>
         </div>
        <h2 className="text-2xl font-bold text-dark-50 mb-3 tracking-tight">ConvoHub Protocol</h2>
        <p className="text-dark-300 max-w-sm mb-8 leading-relaxed">Select a contact or channel to sync streams.</p>
        <div className="flex items-center gap-3 px-4 py-2 bg-dark-800/50 rounded-full border border-dark-700 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span className="text-xs uppercase tracking-widest text-dark-200 font-medium font-mono">Connection Ready</span>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(selectedChat.data._id);
  const isTyping = typingUsers[selectedChat.data._id];

  return (
    <div className={`flex-1 flex flex-col bg-dark-950 h-full relative chat-bg-${chatBackground}`}>
       {/* Ambient background glow managed by theme */}
       <div className="absolute inset-0 pointer-events-none chat-ambient-glow"></div>
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen -translate-y-1/2 translate-x-1/2"></div>

      {/* Header */}
      <div className="px-6 py-4 bg-dark-900/80 backdrop-blur-md border-b border-dark-600 flex items-center justify-between z-10 sticky top-0 md:pl-6 pl-16">
        <div className="flex items-center gap-4 cursor-pointer group/header" onClick={() => selectedChat.type === 'group' && setIsGroupInfoOpen(true)}>
          <div className="relative transform group-hover/header:scale-105 transition-transform">
            {selectedChat.type === 'group' ? (
                <div className="w-11 h-11 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-500/30">#</div>
            ) : selectedChat.data.avatar ? (
                <img src={selectedChat.data.avatar} alt={selectedChat.data.name} className="w-11 h-11 rounded-full object-cover border border-dark-600" />
            ) : (
                <div className="w-11 h-11 rounded-full bg-dark-700 flex items-center justify-center text-dark-50 font-bold border border-dark-600 uppercase">
                    {selectedChat.data.name.charAt(0)}
                </div>
            )}
            {selectedChat.type === 'user' && isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-500 rounded-full border-2 border-dark-900 shadow-[0_0_8px_rgba(0,212,170,0.5)]"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-dark-50 text-[17px] leading-tight flex items-center gap-2 group-hover/header:text-purple-400 transition-colors">
                {selectedChat.data.name}
            </h3>
             {selectedChat.type === 'group' ? (
                 <p className="text-[13px] text-dark-300 mt-0.5">{selectedChat.data.members?.length} participants</p>
             ) : isTyping ? (
                 <p className="text-[13px] text-purple-400 font-medium italic animate-pulse">incoming signal...</p>
             ) : (
                <p className={`text-[13px] font-medium ${isOnline ? 'text-cyan-500' : 'text-dark-300 opacity-60 font-mono'}`}>
                    {isOnline ? 'Active' : `Last sync: ${selectedChat.data.lastSeen ? format(new Date(selectedChat.data.lastSeen), "HH:mm") : 'Offline'}`}
                </p>
             )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-dark-200">
            <button onClick={(e) => { e.stopPropagation(); setIsGroupOptionsOpen(true); }} className="p-2.5 rounded-full hover:bg-dark-800 hover:text-dark-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-6 scroll-smooth z-10 relative">
        {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
                <div className="relative w-12 h-12"><div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div></div>
            </div>
        ) : (
          Object.keys(groupedMessages).map((date) => (
            <div key={date}>
              <div className="flex justify-center my-6">
                <span className="bg-dark-800/80 backdrop-blur-sm text-dark-200 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-dark-600/50 shadow-sm">
                  {date === new Date().toDateString() ? "Today" : format(new Date(date), "MMM d, yyyy")}
                </span>
              </div>
              {groupedMessages[date].map((msg) => (
                <MessageBubble key={msg._id} message={msg} isGroup={selectedChat.type === "group"} />
              ))}
            </div>
          ))
        )}
        {isTyping && (
           <div className="flex items-center gap-2 mb-4 px-6 opacity-70 animate-fade-in">
              <span className="text-xs text-dark-300 font-medium">decrypting stream</span>
              <div className="typing-dots"><span></span><span></span><span></span></div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <ChatInput selectedChat={selectedChat} />

      {selectedChat.type === 'group' && (
        <GroupInfoModal isOpen={isGroupInfoOpen} onClose={() => setIsGroupInfoOpen(false)} group={selectedChat.data} />
      )}
      <GroupOptionsModal 
        isOpen={isGroupOptionsOpen} 
        onClose={() => setIsGroupOptionsOpen(false)} 
        group={selectedChat.data} 
        isGroup={selectedChat.type === 'group'} 
      />
    </div>
  );
};

export default ChatWindow;
