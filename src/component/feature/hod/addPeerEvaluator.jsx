import React, { useState, useEffect, useMemo } from "react";
import { Trash2, UserPlus, Users, Loader2, CheckCircle2, Search } from "lucide-react";
import DataService from "../../../services/axios";

const AddPeerEvaluator = () => {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [peerEvaluators, setPeerEvaluators] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessRes, teachRes] = await Promise.all([
        DataService.get('peerevaluator/Sessions'),
        DataService.get('peerevaluator/Teachers')
      ]);
      setSessions(sessRes.data);
      setTeachers(teachRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluatorsBySession = async (sessionId) => {
    if (!sessionId) {
      setPeerEvaluators([]);
      return;
    }
    setListLoading(true);
    try {
      const res = await DataService.get(`peerevaluator/BySession/${sessionId}`);
      setPeerEvaluators(res.data);
    } catch (err) {
      setPeerEvaluators([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userID?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  // Check using userID (String like 'T001')
  const isAlreadyAssigned = (uId) => {
    return peerEvaluators.some(pe => pe.userID === uId);
  };

  const handleToggleTeacher = (uId) => {
    if (!selectedSession) {
        alert("Please select a session first!");
        return;
    }
    if (isAlreadyAssigned(uId)) return;

    setSelectedTeacherIds(prev =>
      prev.includes(uId) ? prev.filter(item => item !== uId) : [...prev, uId]
    );
  };

  const handleAddSelected = async () => {
    if (!selectedSession) return alert("Please select a session first!");
    if (selectedTeacherIds.length === 0) return alert("Please select at least one faculty member.");
    
    setLoading(true);
    try {
      // Ensuring SessionId is Number and TeacherIds are Strings
      await DataService.post('peerevaluator/Add', {
        SessionId: Number(selectedSession),
        TeacherIds: selectedTeacherIds 
      });
      
      setSelectedTeacherIds([]);
      fetchEvaluatorsBySession(selectedSession);
      alert("Faculty members successfully authorized as Evaluators.");
    } catch (err) {
      console.error("Assignment Error:", err);
      alert("Submission failed. Check if API is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm("Revoke evaluator access for this teacher?")) {
      try {
        await DataService.delete(`peerevaluator/delete/${assignmentId}`);
        fetchEvaluatorsBySession(selectedSession);
      } catch (err) {
        alert("Delete operation failed.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-green-700 p-4 rounded-3xl shadow-xl shadow-green-100">
            <Users className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Peer Access Control</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">HOD Management Portal</p>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-2">
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest ml-1">Academic Session</span>
          <select 
            className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-green-600 focus:bg-white font-black text-gray-700 transition-all cursor-pointer"
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
              fetchEvaluatorsBySession(e.target.value);
              setSelectedTeacherIds([]);
            }}
          >
            <option value="">-- Select Session --</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Faculty Selection */}
        <div className={`bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 transition-all ${!selectedSession ? 'grayscale opacity-50' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-gray-800 uppercase text-xl italic underline decoration-green-500 decoration-4">Faculty List</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-50 rounded-full text-xs font-bold outline-none focus:ring-2 ring-green-100 w-40 md:w-56"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredTeachers.map(t => {
              const assigned = isAlreadyAssigned(t.userID);
              const selected = selectedTeacherIds.includes(t.userID);
              
              return (
                <div 
                  key={t.userID}
                  onClick={() => handleToggleTeacher(t.userID)}
                  className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    assigned ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' :
                    selected ? 'border-green-600 bg-green-50 shadow-md' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-colors ${
                    assigned ? 'bg-gray-200 border-gray-200' :
                    selected ? 'bg-green-600 border-green-600 shadow-lg shadow-green-100' : 'border-gray-200'
                  }`}>
                    {(selected || assigned) && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-sm uppercase ${assigned ? 'text-gray-400' : 'text-gray-800'}`}>{t.name}</p>
                    <div className="flex gap-2">
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">{t.userID}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter border-l pl-2">{t.department}</span>
                    </div>
                  </div>
                  {assigned && <span className="text-[8px] font-black bg-white px-2 py-1 rounded-md text-gray-400 border border-gray-100 uppercase italic">Authorized</span>}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleAddSelected}
            disabled={loading || selectedTeacherIds.length === 0}
            className="w-full mt-6 bg-green-700 hover:bg-black disabled:bg-gray-100 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-50 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
            Grant Evaluator Access {selectedTeacherIds.length > 0 && `(${selectedTeacherIds.length})`}
          </button>
        </div>

        {/* Right: Active Evaluators */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-black text-gray-800 uppercase text-xl italic underline decoration-blue-500 decoration-4">Active Evaluators</h2>
            <div className="px-4 py-1 bg-green-700 rounded-full text-white font-black text-[10px] tracking-widest">
              {peerEvaluators.length} ACTIVE
            </div>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
            {listLoading ? (
               <div className="flex flex-col items-center py-20 gap-3">
                 <Loader2 className="animate-spin text-green-700" size={32} />
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Syncing with server...</p>
               </div>
            ) : peerEvaluators.length > 0 ? (
              peerEvaluators.map(p => (
                <div key={p.assignmentId} className="flex items-center p-4 rounded-[1.5rem] bg-white border-2 border-gray-50 group hover:border-red-100 transition-all shadow-sm hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs mr-4 group-hover:bg-red-50 group-hover:text-red-500">
                    {p.userID}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800 text-sm uppercase leading-tight">{p.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.department}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(p.assignmentId)}
                    className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Revoke Access"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-32 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No evaluators assigned yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddPeerEvaluator;