import React, { useState } from "react";
import toast from "react-hot-toast";
import useThemeStore from "../store/useThemeStore";
import useChatStore from "../store/useChatStore";

const GroupOptionsModal = ({ isOpen, onClose, group, isGroup }) => {
  const [isMuted, setIsMuted] = useState(false);
  const { chatBackground, setChatBackground } = useThemeStore();
  const { leaveGroup } = useChatStore();

  if (!isOpen || !group) return null;

  const handleExitGroup = async () => {
    if (window.confirm(`Are you sure you want to leave ${group.name}?`)) {
      const success = await leaveGroup(group._id);
      if (success) {
        toast.success(`You left ${group.name}`);
        onClose();
      } else {
        toast.error("Failed to leave group");
      }
    }
  };

  const handleAction = (action) => {
    toast.success(`${action} updated for ${group.name}`);
  };

  const themes = [
    { id: "default", color: "bg-purple-500" },
    { id: "cyan", color: "bg-cyan-500" },
    { id: "emerald", color: "bg-emerald-500" },
    { id: "rose", color: "bg-rose-500" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-900 border border-dark-600 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-600 bg-dark-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-dark-50">Options</h3>
          <button onClick={onClose} className="text-dark-300 hover:text-dark-50">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          {/* Mute Toggle */}
          <button 
            onClick={() => { setIsMuted(!isMuted); handleAction(isMuted ? "Unmuted" : "Muted"); }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isMuted ? 'bg-red-500/10 text-red-400' : 'bg-dark-700 text-dark-200'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   {isMuted ? <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/> : <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>}
                </svg>
              </div>
              <span className="text-sm font-medium text-dark-100">Mute Notifications</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${isMuted ? 'bg-purple-500' : 'bg-dark-700'}`}>
               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMuted ? 'right-1' : 'left-1'}`}></div>
            </div>
          </button>

          {/* Media Browser (Placeholder) */}
          <button 
            onClick={() => handleAction("Media Browser")}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-dark-700 text-dark-200">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-dark-100">Media & Files</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-400"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* Theme Selector */}
          <div className="p-3">
             <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">Chat Theme</label>
             <div className="flex gap-4">
                {themes.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { setChatBackground(t.id); handleAction(`Theme ${t.id}`); }}
                    className={`w-8 h-8 rounded-full ${t.color} border-2 transition-transform hover:scale-110 ${chatBackground === t.id ? 'border-white' : 'border-transparent'}`}
                  />
                ))}
             </div>
          </div>

          {/* Danger Zone - Only for groups */}
          {isGroup && (
            <div className="pt-4 border-t border-dark-600/50">
              <button 
                onClick={handleExitGroup}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <div className="p-2 rounded-lg bg-red-500/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                </div>
                <span className="text-sm font-bold">Exit Group</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-dark-800/50 border-t border-dark-600 flex justify-end">
           <button onClick={onClose} className="text-sm font-bold text-purple-400 hover:text-purple-300">Done</button>
        </div>
      </div>
    </div>
  );
};

export default GroupOptionsModal;
