// ============================================================
// MessageBubble Component
// Renders individual messages, supports reactions, read receipts, and deletion
// ============================================================

import { useState, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import useChatStore from "../store/useChatStore";
import { format } from "date-fns";
import toast from "react-hot-toast";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const MessageBubble = ({ message, isGroup }) => {
  const { user } = useAuthStore();
  const { reactToMessage, deleteMessage } = useChatStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const isSentByMe = message.senderId?._id === user._id || message.senderId === user._id;

  // DEBUG: Direct string log for easy viewing
  if (message.fileUrl) {
    console.log(`RENDER ATTEMPT [${message._id}]: URL="${message.fileUrl}" TYPE="${message.type}"`);
  }

  // Blue Double Ticks: check if message has been read by someone other than the sender
  const isRead = message.readBy?.some(id => id.toString() !== (message.senderId?._id || message.senderId || "").toString());

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowReactions(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 500); // 500ms grace period to allow cursor to reach the emojis
  };

  const handleReact = (emoji) => {
    reactToMessage(message._id, emoji);
    setShowReactions(false);
  };

  const handleDelete = async (forEveryone = false) => {
     const success = await deleteMessage(message._id, forEveryone);
     if (success) {
        toast.success(forEveryone ? "Message deleted for everyone" : "Message deleted for you");
     } else {
        toast.error("Failed to delete message");
     }
     setShowOptions(false);
  };

  const reactionsCount = message.reactions?.reduce((acc, rx) => {
    acc[rx.emoji] = (acc[rx.emoji] || 0) + 1;
    return acc;
  }, {});

  const myReactions = message.reactions
    ?.filter((rx) => rx.userId?._id === user._id || rx.userId === user._id)
    .map((rx) => rx.emoji) || [];

  return (
    <div className={`flex w-full mb-4 px-4 sm:px-6 relative group ${isSentByMe ? "justify-end" : "justify-start"}`}>
      {!isSentByMe && isGroup && (
        <div className="mr-2 self-end mb-4">
          {message.senderId?.avatar ? (
            <img
              src={message.senderId.avatar}
              alt={message.senderId.name}
              className="w-8 h-8 rounded-full object-cover border border-dark-600 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-[10px] font-bold text-dark-50 border border-dark-600 uppercase">
              {message.senderId?.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
      )}

      <div 
        className={`relative max-w-[92%] sm:max-w-[70%] fade-in`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!isSentByMe && isGroup && (
            <div className="text-xs text-dark-300 ml-1 mb-1 font-medium">
                {message.senderId?.name}
            </div>
        )}

        <div className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words relative w-fit group/bubble
          ${message.isDeleted ? "bg-dark-700/50 border border-dark-600 text-dark-300 italic opacity-60 rounded-xl" : (isSentByMe ? "msg-sent ml-auto text-dark-50" : "msg-received text-dark-50")}`}
        >
          {/* Reaction Toolbar (Hover) */}
          {showReactions && !message.isDeleted && (
            <div 
                className={`absolute -top-11 flex items-center gap-1.5 bg-dark-800 p-1.5 rounded-full border border-dark-600 shadow-2xl z-50 animate-fade-in
                ${isSentByMe ? "right-0" : "left-0"}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-dark-600 rounded-full transition-transform hover:scale-125"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
          )}

          {/* Delete Menu Trigger */}
          {!message.isDeleted && (
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="absolute top-1 right-2 opacity-0 group-hover/bubble:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity"
            >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m6 9 6 6 6-6" />
               </svg>
            </button>
          )}

          {showOptions && !message.isDeleted && (
            <div className="absolute top-full mt-1 right-0 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-[60] overflow-hidden min-w-[160px] animate-fade-in">
                <button onClick={() => handleDelete(false)} className="w-full text-left px-4 py-2.5 hover:bg-dark-700 text-sm transition-colors border-b border-dark-600">Delete for me</button>
                {isSentByMe && (
                   <button onClick={() => handleDelete(true)} className="w-full text-left px-4 py-2.5 hover:bg-dark-700 text-sm text-red-500 font-medium transition-colors">Delete for everyone</button>
                )}
            </div>
          )}

          {/* Media & Attachments — Sane handling for Both Images and Files */}
          {!message.isDeleted && message.fileUrl && (
            <>
              {/* IMAGE DISPLAY */}
              {message.type === "image" ? (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/10 mt-1 cursor-pointer bg-dark-700 min-h-[100px] flex items-center justify-center transition-all hover:border-cyan-500/30" onClick={() => window.open(message.fileUrl, '_blank')}>
                  <img src={message.fileUrl} alt="attachment" className="max-w-full sm:max-w-[400px] h-auto object-cover block"/>
                </div>
              ) : (
                /* FILE/DOCUMENT DISPLAY */
                <a 
                  href={message.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-dark-800 border border-dark-600 hover:border-cyan-500/50 hover:bg-dark-700 transition-all group/file"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover/file:bg-cyan-500 group-hover/file:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate text-dark-50">{message.fileName || "Document"}</div>
                    <div className="text-[10px] uppercase tracking-widest text-dark-400 font-bold">
                       {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : "Signal Payload"}
                    </div>
                  </div>
                </a>
              )}
            </>
          )}

          {/* Text Content */}
          <div className="flex items-center gap-2">
              {message.isDeleted && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
              )}
              <span className="whitespace-pre-wrap">{message.content}</span>
          </div>

          {/* Meta Information (Time + Ticks) */}
          <div className={`flex items-center gap-1.5 mt-1 text-[10px] font-bold opacity-60 float-right ml-4 pt-1 select-none`}>
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {isSentByMe && !message.isDeleted && (
              <span className="ml-1">
                {isRead ? (
                  <div className="flex -space-x-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="3.5" className="drop-shadow-[0_0_3px_rgba(34,211,238,0.7)]">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="3.5" className="drop-shadow-[0_0_3px_rgba(34,211,238,0.7)]">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            )}
          </div>
          <div className="clear-both"></div>
        </div>

        {/* Display Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isSentByMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactionsCount).map(([emoji, count]) => {
              const hasReacted = myReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`reaction-pill ${hasReacted ? 'reacted' : ''}`}
                >
                  <span className="text-xs">{emoji}</span>
                  <span className={`text-[10px] font-bold ${hasReacted ? 'text-indigo-400' : 'text-dark-200'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
