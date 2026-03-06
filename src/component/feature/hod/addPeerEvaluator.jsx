import React, { useState, useEffect, useMemo } from "react";
import { Trash2, UserPlus, Users, Loader2, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import DataService from "../../../services/axios";

const AddPeerEvaluator = () => {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]); // Non-permanent selection list
  const [peerEvaluators, setPeerEvaluators] = useState([]); // Active in session (includes permanent)
  const [permanentTeachers, setPermanentTeachers] = useState([]); // For the Top Card
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessRes, teachRes, permRes] = await Promise.all([
        DataService.get('peerevaluator/Sessions'),
        DataService.get('peerevaluator/Teachers'),
        DataService.get('peerevaluator/PermanentTeachers')
      ]);
      setSessions(sessRes.data);
      setTeachers(teachRes.data);
      setPermanentTeachers(permRes.data);
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
    if (selectedTeacherIds.length === 0) return alert("Select at least one faculty member.");
    
    setLoading(true);
    try {
      await DataService.post('peerevaluator/Add', {
        SessionId: Number(selectedSession),
        TeacherIds: selectedTeacherIds 
      });
      setSelectedTeacherIds([]);
      fetchEvaluatorsBySession(selectedSession);
      alert("Evaluators authorized successfully.");
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    // assignmentId 0 means it's a permanent record from C# logic
    if (assignmentId === 0) return; 

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
    <div className="max-w-7xl mx-auto p-6 space-y-6 min-h-screen font-sans bg-gray-50/30">
      
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-green-700 p-4 rounded-3xl shadow-xl shadow-green-100">
            <Users className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Add Peer Access Control</h1>
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

      {/* --- NEW: PERMANENT EVALUATORS CARD --- */}
      <div className="bg-white border border-green-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Star className="text-yellow-500 fill-yellow-500" size={20} />
          <h2 className="font-black text-gray-800 uppercase text-lg italic">Permanent Evaluators</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {permanentTeachers.map(pt => (
            <div key={pt.userID} className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm"><ShieldCheck className="text-green-700" size={18} /></div>
              <div>
                <p className="font-black text-xs text-gray-800 uppercase">{pt.name}</p>
                <p className="text-[10px] text-green-600 font-bold uppercase">{pt.department}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Faculty Selection */}
        <div className={`bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 transition-all ${!selectedSession ? 'grayscale opacity-50' : ''}`}>
          <h2 className="font-black text-gray-800 uppercase text-xl mb-6 italic underline decoration-green-500 decoration-4">Add Faculty</h2>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {teachers.map(t => {
              const assigned = isAlreadyAssigned(t.userID);
              const selected = selectedTeacherIds.includes(t.userID);
              return (
                <div 
                  key={t.userID}
                  onClick={() => handleToggleTeacher(t.userID)}
                  className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    assigned ? 'bg-gray-50 border-gray-100 opacity-60' :
                    selected ? 'border-green-600 bg-green-50 shadow-md' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center ${
                    assigned ? 'bg-gray-200 border-gray-200' :
                    selected ? 'bg-green-600 border-green-600' : 'border-gray-200'
                  }`}>
                    {(selected || assigned) && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-sm uppercase ${assigned ? 'text-gray-400' : 'text-gray-800'}`}>{t.name}</p>
                    <span className="text-[9px] font-black text-green-600 uppercase">{t.userID} | {t.department}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleAddSelected}
            disabled={loading || selectedTeacherIds.length === 0}
            className="w-full mt-6 bg-green-700 hover:bg-black text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
            Grant Evaluator Access {selectedTeacherIds.length > 0 && `(${selectedTeacherIds.length})`}
          </button>
        </div>

        {/* Right: Active Evaluators */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-black text-gray-800 uppercase text-xl italic underline decoration-blue-500 decoration-4">Session Evaluators</h2>
            <div className="px-4 py-1 bg-green-700 rounded-full text-white font-black text-[10px] tracking-widest uppercase">
              {peerEvaluators.length} ACTIVE
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {listLoading ? (
               <div className="flex flex-col items-center py-20 gap-3">
                 <Loader2 className="animate-spin text-green-700" size={32} />
                 <p className="text-[10px] font-black text-gray-300 uppercase italic">Loading evaluators...</p>
               </div>
            ) : peerEvaluators.length > 0 ? (
              peerEvaluators.map(p => (
                <div key={p.userID} className={`flex items-center p-4 rounded-[1.5rem] border-2 transition-all ${p.isPermanent ? 'border-green-100 bg-green-50/20' : 'border-gray-50 bg-white'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs mr-4 ${p.isPermanent ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                    {p.userID}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800 text-sm uppercase flex items-center gap-2">
                      {p.name} {p.isPermanent && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{p.department}</p>
                  </div>
                  
                  {/* DELETE BUTTON: Only show if NOT permanent (assignmentId != 0) */}
                  {!p.isPermanent && (
                    <button 
                      onClick={() => handleDelete(p.assignmentId)}
                      className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Revoke Access"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {p.isPermanent && (
                    <span className="text-[8px] font-black text-green-600 bg-white border border-green-100 px-2 py-1 rounded-md uppercase italic">Permanent</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-32 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                Select a session to view evaluators.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddPeerEvaluator;