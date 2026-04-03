import React from "react";
import useAuthStore from "../store/useAuthStore";

const GroupInfoModal = ({ isOpen, onClose, group }) => {
  const { user: currentUser } = useAuthStore();
  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-900 border border-dark-600 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-dark-600 bg-dark-800/50">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-3xl border-2 border-purple-500/30 mx-auto mb-4">
             #
          </div>
          <h3 className="text-xl font-bold text-dark-50">{group.name}</h3>
          <p className="text-sm text-dark-300 mt-1">{group.members.length} participants</p>
        </div>

        {/* Member List */}
        <div className="p-6">
          <h4 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-4">Members</h4>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {group.members.map((member) => (
              <div key={member._id} className="flex items-center gap-3">
                <div className="relative">
                  {member.avatar ? (
                    <img src={member.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-dark-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-dark-50 font-bold border border-dark-600 uppercase">
                       {member.name.charAt(0)}
                    </div>
                  )}
                  {member.isOnline && (
                     <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-dark-900"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-dark-50 truncate">{member.name}</span>
                       {member._id === group.admin?._id && (
                           <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-tighter">Admin</span>
                       )}
                   </div>
                   <p className="text-xs text-dark-300 truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-100 rounded-xl text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
