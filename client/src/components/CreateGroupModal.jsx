import { useState } from "react";
import useChatStore from "../store/useChatStore";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { users, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name is required");
    
    setIsSubmitting(true);
    const success = await createGroup({
      name,
      members: selectedUsers
    });

    if (success) {
      toast.success("Group created!");
      onClose();
    } else {
      toast.error("Failed to create group");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-dark-600 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-600 flex justify-between items-center bg-dark-800">
          <h3 className="text-lg font-bold text-dark-50">Create New Group</h3>
          <button onClick={onClose} className="text-dark-300 hover:text-dark-50">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Alpha"
              className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 px-4 text-dark-50 placeholder-dark-400 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Select Members</label>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {users.length === 0 ? (
                  <p className="text-sm text-dark-400 italic">No contacts found to add.</p>
              ) : (
                users.map(u => (
                  <div 
                    key={u._id}
                    onClick={() => toggleUser(u._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedUsers.includes(u._id) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-dark-800/50 border-transparent hover:bg-dark-800'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-dark-50 font-bold border border-dark-600">
                       {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-dark-100">{u.name}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedUsers.includes(u._id) ? 'bg-purple-500 border-purple-500' : 'border-dark-500'}`}>
                       {selectedUsers.includes(u._id) && (
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full btn-primary py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
