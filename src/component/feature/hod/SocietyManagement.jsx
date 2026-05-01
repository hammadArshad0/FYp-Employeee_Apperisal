import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Plus, Edit2, Trash2, Search,
  Calendar, X, ShieldCheck, CheckSquare, Square, Loader2
} from 'lucide-react';
import DataService from '../../../services/axios';

const SocietyManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [sessions, setSessions] = useState([]); 
  const [selectedSession, setSelectedSession] = useState(""); 
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchMentor, setSearchMentor] = useState('');
  const [searchChairperson, setSearchChairperson] = useState('');

  // Form States
  const [newSoc, setNewSoc] = useState({ SocietyName: '', Description: '' });
  const [editingSocId, setEditingSocId] = useState(null); 
  
  // Selection States
  const [targetSocId, setTargetSocId] = useState(''); 
  const [selectedMentorIds, setSelectedMentorIds] = useState([]); 
  const [selectedChairpersonId, setSelectedChairpersonId] = useState(null); // Fixed for single selection

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSession) fetchSocieties();
  }, [selectedSession]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tRes, sessRes] = await Promise.all([
        DataService.get('/SocietyManagement/GetTeachers'),
        DataService.get('/session/list') 
      ]);
      setTeachers(tRes.data || []);
      setSessions(sessRes.data || []);
      if (sessRes.data?.length > 0) {
        setSelectedSession(sessRes.data[sessRes.data.length - 1].id);
      }
    } catch (error) {
      console.error("Initialization Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await DataService.get(`/SocietyManagement/GetAll?sessionId=${selectedSession}`);
      setSocieties(res.data || []);
    } catch (err) { 
      setSocieties([]); 
    }
  };

  // --- SOCIETY ACTIONS ---
  const handleSaveSociety = async () => {
    if (!newSoc.SocietyName.trim()) return alert("Society Name is required!");
    try {
      if (editingSocId) {
        await DataService.put(`/SocietyManagement/UpdateSociety/${editingSocId}`, newSoc);
      } else {
        await DataService.post('/SocietyManagement/AddSociety', newSoc);
      }
      setNewSoc({ SocietyName: '', Description: '' });
      setEditingSocId(null);
      fetchSocieties();
    } catch (err) { alert("Save failed."); }
  };

  // --- ASSIGNMENT ACTIONS ---
  const handleAssignChairperson = async () => {
    // 1. Validation: Ensure all fields are selected
    // Note: selectedChairpersonId string hai, isliye parseInt nahi lagayenge
    if (!targetSocId || !selectedChairpersonId || !selectedSession) {
        return alert("Please select a Society, a Chairperson, and a Session");
    }
    
    const payload = {
      TeacherId: selectedChairpersonId, // Fixed: parseInt hata diya kyunki ID string hai
      SocietyId: parseInt(targetSocId),
      SessionId: parseInt(selectedSession),
      IsChairperson: true,
      IsMentor: false
    };

    console.log("Assigning Chairperson Payload:", payload);

    try {
      const response = await DataService.post('/SocietyManagement/AssignTeacher', payload);
      
      // 2. Success Handling
      alert("Chairperson Assigned/Updated Successfully!");
      
      // State reset karein taake selection clear ho jaye
      setSelectedChairpersonId(null);
      
      // 3. UI Refresh: Matrix aur list ko update karne ke liye
      fetchSocieties(); 
      
    } catch (err) { 
      console.error("Assignment Error:", err.response?.data || err.message);
      
      // Backend se aane wala specific error message dikhayen
      const errorMsg = err.response?.data?.ExceptionMessage || err.response?.data?.message || "Assignment failed";
      alert("Error: " + errorMsg); 
    }
  };

  const handleBulkAssignMentors = async () => {
    if (!targetSocId || selectedMentorIds.length === 0) return alert("Select Society and at least one Mentor");
    
    const payload = selectedMentorIds.map(tId => ({
      TeacherId: tId,
      SocietyId: parseInt(targetSocId),
      SessionId: parseInt(selectedSession),
      IsChairperson: false,
      IsMentor: true
    }));

    try {
      await DataService.post('/SocietyManagement/AssignMentorsBulk', payload);
      alert("Mentors Assigned Successfully!");
      setSelectedMentorIds([]);
      fetchSocieties();
    } catch (err) { alert("Mentor assignment failed"); }
  };

  const handleRemoveAssignment = async (assignId) => {
    if (window.confirm("Remove this assignment?")) {
      try {
        await DataService.delete(`/SocietyManagement/DeleteAssignment/${assignId}`);
        fetchSocieties();
      } catch (err) { alert("Action failed"); }
    }
  };

  // Filter Logic
  const filteredMentors = teachers.filter(t => t.name.toLowerCase().includes(searchMentor.toLowerCase()));
  const filteredChairpersons = teachers.filter(t => t.name.toLowerCase().includes(searchChairperson.toLowerCase()));

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
      
      {/* Top Header */}
      <div className="max-w-[1600px] mx-auto mb-8 bg-white p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center justify-between border-b-4 border-green-600">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg"><Building2 size={24} /></div>
          <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Society Management</h1>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Calendar className="text-slate-400" size={18}/>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)} 
            className="bg-transparent border-none font-black text-slate-700 text-xs outline-none cursor-pointer"
          >
            {sessions.map(sess => <option key={sess.id} value={sess.id}>{sess.name}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        
        {/* 1. SOCIETY REGISTRATION CARD */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="text-[11px] font-black text-green-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Plus size={16}/> {editingSocId ? "Update" : "Register"} Society
            </h2>
            <div className="space-y-4">
              <input 
                value={newSoc.SocietyName} 
                onChange={(e) => setNewSoc({...newSoc, SocietyName: e.target.value})} 
                placeholder="Society Name..." 
                className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-sm outline-none focus:ring-2 ring-green-500/20" 
              />
              <textarea 
                value={newSoc.Description} 
                onChange={(e) => setNewSoc({...newSoc, Description: e.target.value})} 
                placeholder="Objectives..." 
                className="w-full bg-slate-50 rounded-2xl p-4 h-24 font-medium text-sm outline-none resize-none"
              />
              <button onClick={handleSaveSociety} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all">
                {editingSocId ? "Save Changes" : "Create Society"}
              </button>
            </div>
          </div>

          {/* Mini Society List */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Active Societies</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {societies.map(s => (
                <div key={s.SocietyId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group hover:bg-white hover:shadow-md transition-all">
                  <span className="text-[11px] font-black text-slate-700 uppercase italic">{s.SocietyName}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingSocId(s.SocietyId); setNewSoc({SocietyName: s.SocietyName, Description: s.Description}) }} className="text-blue-500"><Edit2 size={14}/></button>
                    <button onClick={() => { if(window.confirm("Delete Society?")) DataService.delete(`/SocietyManagement/DeleteSociety/${s.SocietyId}`).then(fetchSocieties) }} className="text-red-500"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* UNIVERSAL TARGET SELECTOR */}
          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-white font-black uppercase italic text-sm tracking-widest">Select Society to Manage:</h3>
            <select 
              value={targetSocId} 
              onChange={(e) => setTargetSocId(e.target.value)} 
              className="w-full md:w-1/2 bg-white/10 text-white border-none rounded-xl p-3 font-black text-xs outline-none cursor-pointer"
            >
              <option className="text-black" value="">Choose Society...</option>
              {societies.map(s => <option className="text-black" key={s.SocietyId} value={s.SocietyId}>{s.SocietyName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 2. CHAIRPERSON CARD */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-green-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-green-600"/> Chairperson
                </h2>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    value={searchChairperson} 
                    onChange={e => setSearchChairperson(e.target.value)} 
                    placeholder="Search..." 
                    className="bg-slate-50 pl-9 pr-4 py-2 rounded-full text-[10px] font-bold outline-none border border-slate-200 focus:border-green-400 w-32" 
                  />
                </div>
              </div>

              <div className="space-y-2 h-60 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                {filteredChairpersons.map(t => (
                  <div 
                    key={t.userID} 
                    onClick={() => setSelectedChairpersonId(t.userID)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border-2 ${selectedChairpersonId === t.userID ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                  >
                    {selectedChairpersonId === t.userID ? <CheckSquare size={18} className="text-green-600"/> : <Square size={18} className="text-slate-300"/>}
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{t.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleAssignChairperson} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg">
                Assign Chairperson
              </button>
            </div>

            {/* 3. MENTOR CARD */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-slate-900">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600"/> Mentor Team
                </h2>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    value={searchMentor} 
                    onChange={e => setSearchMentor(e.target.value)} 
                    placeholder="Search..." 
                    className="bg-slate-50 pl-9 pr-4 py-2 rounded-full text-[10px] font-bold outline-none border border-slate-200 focus:border-blue-400 w-32" 
                  />
                </div>
              </div>

              <div className="space-y-2 h-60 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                {filteredMentors.map(t => (
                  <div 
                    key={t.userID} 
                    onClick={() => setSelectedMentorIds(prev => prev.includes(t.userID) ? prev.filter(id => id !== t.userID) : [...prev, t.userID])}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border-2 ${selectedMentorIds.includes(t.userID) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                  >
                    {selectedMentorIds.includes(t.userID) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-300"/>}
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{t.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleBulkAssignMentors} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-100">
                Add To Mentor Team
              </button>
            </div>
          </div>

          {/* SUMMARY MATRIX */}
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
             <h2 className="text-sm font-black uppercase italic mb-8 text-slate-800 border-l-4 border-green-600 pl-4">Management Matrix</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {societies.filter(s => s.Chairpersons?.length > 0 || s.Mentors?.length > 0).map(soc => (
                  <div key={soc.SocietyId} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 hover:border-green-300 transition-all">
                    <h4 className="font-black text-green-700 uppercase italic text-xs mb-4 pb-2 border-b border-slate-200">{soc.SocietyName}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-widest">Chairperson</p>
                        {soc.Chairpersons.map(c => (
                          <div key={c.AssignmentId} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-green-100">
                            <span className="text-[10px] font-black uppercase text-slate-700">{c.TeacherName}</span>
                            <button onClick={() => handleRemoveAssignment(c.AssignmentId)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-widest">Mentor Team</p>
                        <div className="flex flex-wrap gap-2">
                          {soc.Mentors.map(m => (
                            <div key={m.AssignmentId} className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-md">
                              <span className="text-[9px] font-bold uppercase">{m.TeacherName}</span>
                              <button onClick={() => handleRemoveAssignment(m.AssignmentId)} className="text-slate-400 hover:text-red-400 border-l border-white/20 pl-1.5"><X size={10}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SocietyManagement;