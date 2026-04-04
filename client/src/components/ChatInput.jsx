// ============================================================
// ChatInput Component
// Input field, emoji picker toggle, file attachments, 
// typing indicator emissions
// ============================================================

import { useState, useRef, useEffect } from "react";
import useChatStore from "../store/useChatStore";
import { getSocket } from "../lib/socket";
import api from "../lib/api";
import toast from "react-hot-toast";
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({ selectedChat }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  
  const { sendMessage, sendGroupMessage } = useChatStore();

  // Reset input when chat changes
  useEffect(() => {
    setMessage("");
    setIsTyping(false);
    setShowEmojiPicker(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  }, [selectedChat?.data?._id]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setMessage(val);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    
    if (!selectedChat) return;

    const socket = getSocket();
    const eventName = selectedChat.type === "group" ? "groupTyping" : "typing";
    const payload = selectedChat.type === "group" 
      ? { groupId: selectedChat.data._id }
      : { receiverId: selectedChat.data._id };
        
    if (!isTyping) {
        setIsTyping(true);
        socket.emit(eventName, payload);
    }

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        const stopEvent = selectedChat.type === "group" ? "groupStopTyping" : "stopTyping";
        socket.emit(stopEvent, payload);
    }, 2000);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    
    if (!message.trim() && !isUploading) return;

    const content = message.trim();
    setMessage("");
    setShowEmojiPicker(false);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
    
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    const socket = getSocket();
    if (selectedChat?.type === "group") {
        socket.emit("groupStopTyping", { groupId: selectedChat.data._id });
        await sendGroupMessage({ groupId: selectedChat.data._id, content });
    } else {
        socket.emit("stopTyping", { receiverId: selectedChat.data._id });
        await sendMessage({ receiverId: selectedChat.data._id, content });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      if (res.data.success) {
        const { url, type, name, size } = res.data.file;

        const payload = {
          type: type || "image",
          fileUrl: url,
          fileName: name || file.name,
          fileSize: size || file.size,
          content: "",
        };

        if (selectedChat?.type === "group") {
          payload.groupId = selectedChat.data._id;
          console.log("SENDING GROUP IMAGE:", payload);
          await sendGroupMessage(payload);
        } else {
          payload.receiverId = selectedChat.data._id;
          console.log("SENDING PRIVATE IMAGE:", payload);
          await sendMessage(payload);
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed. Verify Cloudinary credentials in server/.env");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="px-3 py-2 sm:p-4 bg-dark-950/60 backdrop-blur-xl border-t border-dark-600 z-[60] relative">
      <form onSubmit={handleSend} className="flex items-end gap-0.5 sm:gap-2 relative">
        
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-4 z-[70] shadow-2xl animate-fade-in">
             <EmojiPicker 
                onEmojiClick={handleEmojiClick} 
                theme="dark" 
                lazyLoadEmojis={true}
                searchPlaceholder="Search protocol signals..."
                width={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
                height={400}
             />
          </div>
        )}

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 sm:p-2.5 mb-0.5 rounded-lg text-dark-200 hover:text-white hover:bg-dark-800 transition-colors shrink-0 outline-none disabled:opacity-50"
          title="Attach File"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-dark-300 border-t-purple-500 rounded-full animate-spin"></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>

        {/* Emoji Button */}
        <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1.5 sm:p-2.5 mb-0.5 rounded-lg transition-colors shrink-0 outline-none ${showEmojiPicker ? 'text-purple-400 bg-dark-800' : 'text-dark-200 hover:text-white hover:bg-dark-800'}`}
            title="Emojis"
            disabled={isUploading}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />

        {/* Text Input Control */}
        <div className="flex-1 bg-dark-950/40 backdrop-blur-md rounded-xl border border-white/5 focus-within:border-purple-500/30 focus-within:bg-dark-800/80 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all flex items-center mb-0.5 overflow-hidden">
            <textarea
                ref={textareaRef}
                rows="1"
                value={message}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full bg-transparent border-none py-3 px-4 text-dark-50 placeholder-dark-500 focus:outline-none text-[15px] resize-none leading-relaxed"
                disabled={isUploading}
                style={{ maxHeight: '150px' }}
            />
        </div>

        {/* Send Action */}
        <button
          type="submit"
          disabled={!message.trim() || isUploading}
          className="btn-primary p-3 sm:p-4 mb-0.5 rounded-2xl shrink-0 outline-none flex items-center justify-center transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-white">
             <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
      <div className="text-center mt-2 text-[10px] text-dark-500 font-medium tracking-[0.1em] uppercase select-none opacity-60">
        Press enter to send, shift+enter for new line
      </div>
    </div>
  );
};

export default ChatInput;
