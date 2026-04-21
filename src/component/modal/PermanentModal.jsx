import React, { useState } from "react";
import { X, Search, Trash2, Edit3, CheckCircle2, Loader2, Settings2 } from "lucide-react";
import DataService from "../../services/axios";



const PermanentManagementModal = ({ isOpen, onClose, permanentTeachers, allTeachers, onRefresh }) => {
  const [loadingId, setLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // Function to toggle permanent status
  const handleToggleStatus = async (user) => {
    const isCurrentlyPermanent = permanentTeachers.some(p => p.userID === user.userID);
    setLoadingId(user.userID);
    
    try {
      // API call to toggle status
    await DataService.post('peerevaluator/TogglePermanent', { 
  UserID: user.userID,
  IsPermanent: !isCurrentlyPermanent
});
      onRefresh(); // Refresh parent data
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  };

  // Filter and Combine Data
  const filteredList = [...allTeachers, ...permanentTeachers]
    .filter((v, i, a) => a.findIndex(t => t.userID === v.userID) === i) // Remove duplicates
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
     
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Settings2 className="text-green-700" size={24} />
            <div>
              <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Permanent Evaluator</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage Permanent Faculty Members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search faculty by name..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-600 focus:bg-white transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Faculty List */}
        <div className="px-8 pb-8 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
          {filteredList.map((user) => {
            const isPermanent = permanentTeachers.some(p => p.userID === user.userID);
            const isLoading = loadingId === user.userID;

            return (
              <div key={user.userID} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${isPermanent ? 'border-green-100 bg-green-50/30' : 'border-transparent bg-gray-50/50'}`}>
                
                <div className="flex items-center gap-4">
                  {/* Checkbox Icon */}
                  <div 
                    onClick={() => !isLoading && handleToggleStatus(user)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${isPermanent ? 'bg-green-600 border-green-600' : 'bg-white border-gray-200'}`}
                  >
                    {isLoading ? <Loader2 size={12} className="animate-spin text-white" /> : isPermanent && <CheckCircle2 size={14} className="text-white" />}
                  </div>

                  <div>
                    <p className="font-black text-sm text-gray-800 uppercase">{user.name}</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight">{user.department} | {user.userID}</p>
                  </div>
                </div>

                {/* Actions Icons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Profile">
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user)}
                    className={`p-2 rounded-xl transition-all ${isPermanent ? 'text-red-500 hover:bg-red-50' : 'text-gray-300 pointer-events-none'}`}
                    title="Remove Permanent Status"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
          >
            Save & Exit
          </button>
        </div>

      </div>
    </div>
  );
};

export default PermanentManagementModal;