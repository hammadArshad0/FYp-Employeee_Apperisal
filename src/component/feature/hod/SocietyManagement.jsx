import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Plus, Edit2, Trash2, 
  LayoutDashboard, Calendar, X, ShieldCheck 
} from 'lucide-react';
import DataService from '../../../services/axios';

const SocietyManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [sessions, setSessions] = useState([]); 
  const [selectedSession, setSelectedSession] = useState(""); 
  const [loading, setLoading] = useState(true);

  // Form States
  const [newSoc, setNewSoc] = useState({ SocietyName: '', Description: '' });
  const [editingSocId, setEditingSocId] = useState(null); 
  const [mentorSelection, setMentorSelection] = useState({ socId: '', teacherId: '' });
  const [chairSelection, setChairSelection] = useState({ socId: '', teacherId: '' });

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
      
      if (sessRes.data && sessRes.data.length > 0) {
        setSelectedSession(sessRes.data[sessRes.data.length - 1].id);
      }
      setLoading(false);
    } catch (error) {
      console.error("Initialization Failed:", error);
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    try {
      const res = await DataService.get(`/SocietyManagement/GetAll?sessionId=${selectedSession}`);
      setSocieties(res.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err);
      setSocieties([]); 
    }
  };

  // 1. CREATE / UPDATE SOCIETY
  const handleSaveSociety = async () => {
    if (!newSoc.SocietyName.trim()) return alert("Society Name is required!");
    try {
      if (editingSocId) {
        await DataService.put(`/SocietyManagement/UpdateSociety/${editingSocId}`, newSoc);
        alert("Society Updated!");
      } else {
        await DataService.post('/SocietyManagement/AddSociety', newSoc);
        alert("Society Created!");
      }
      setNewSoc({ SocietyName: '', Description: '' });
      setEditingSocId(null);
      fetchSocieties();
    } catch (err) { 
      alert("Action failed. Please check backend."); 
    }
  };

  // 2. DELETE SOCIETY
  const handleDeleteSociety = async (id) => {
    if (window.confirm("Are you sure? This will delete all assignments too!")) {
      try {
        await DataService.delete(`/SocietyManagement/DeleteSociety/${id}`);
        fetchSocieties();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  // 3. ASSIGN MENTOR
  const handleAddMentor = async () => {
    if (!mentorSelection.socId || !mentorSelection.teacherId) return alert("Select Society & Teacher");
    const payload = [{
      TeacherId: parseInt(mentorSelection.teacherId),
      SocietyId: parseInt(mentorSelection.socId),
      SessionId: parseInt(selectedSession),
      IsChairperson: false,
      IsMentor: true
    }];
    try {
      await DataService.post('/SocietyManagement/AssignMentorsBulk', payload);
      setMentorSelection({ ...mentorSelection, teacherId: '' });
      fetchSocieties();
    } catch (err) { alert("Assignment failed"); }
  };

  // 4. ASSIGN CHAIRPERSON
  const handleAddChair = async () => {
    if (!chairSelection.socId || !chairSelection.teacherId) return alert("Select Society & Teacher");
    const payload = {
      TeacherId: parseInt(chairSelection.teacherId),
      SocietyId: parseInt(chairSelection.socId),
      SessionId: parseInt(selectedSession),
      IsChairperson: true,
      IsMentor: false
    };
    try {
      await DataService.post('/SocietyManagement/AssignTeacher', payload);
      setChairSelection({ ...chairSelection, teacherId: '' });
      fetchSocieties();
    } catch (err) { alert("Chairperson assignment failed"); }
  };

  // 5. REMOVE INDIVIDUAL ASSIGNMENT
  const handleRemoveAssignment = async (assignId) => {
    if (window.confirm("Remove this teacher from the society?")) {
      try {
        await DataService.delete(`/SocietyManagement/DeleteAssignment/${assignId}`);
        fetchSocieties();
      } catch (err) { alert("Deletion failed"); }
    }
  };

  const getSessionName = (id) => sessions.find(s => s.id.toString() === id.toString())?.name || "Unknown Session";

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-green-700 italic animate-pulse text-2xl">LOADING UEAMS PORTAL...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
      
      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-8 bg-white p-6 rounded-3xl shadow-sm border-b-4 border-green-600 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg"><LayoutDashboard size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Society Management</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-widest">UEAMS HOD Portal</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Calendar className="text-green-600" size={20}/>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)} 
            className="bg-transparent border-none font-bold text-slate-700 text-sm outline-none cursor-pointer"
          >
            {sessions.map(sess => <option key={sess.id} value={sess.id}>{sess.name}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
        
        {/* Left Panel: Form & List */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2">
              <Building2 className="text-green-600" size={20}/> {editingSocId ? "Edit" : "Register"} Society
            </h2>
            <div className="space-y-4">
              <input 
                value={newSoc.SocietyName} 
                onChange={(e) => setNewSoc({...newSoc, SocietyName: e.target.value})} 
                placeholder="Society Name" 
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-sm outline-none focus:ring-2 ring-green-500/20" 
              />
              <textarea 
                value={newSoc.Description} 
                onChange={(e) => setNewSoc({...newSoc, Description: e.target.value})} 
                placeholder="Description..." 
                className="w-full bg-slate-50 border-none rounded-xl p-4 h-24 font-medium text-sm outline-none focus:ring-2 ring-green-500/20 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveSociety} className="flex-1 bg-green-600 text-white font-black py-4 rounded-xl shadow-md uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all">
                  {editingSocId ? "Update Now" : "Create Society"}
                </button>
                {editingSocId && (
                  <button onClick={() => {setEditingSocId(null); setNewSoc({SocietyName:'', Description:''})}} className="bg-slate-100 px-4 rounded-xl text-slate-400 hover:text-red-500"><X size={20}/></button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 italic">Available Societies</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {societies.map(s => (
                <div key={s.SocietyId} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group hover:bg-green-50 transition-colors">
                  <h4 className="font-black text-slate-700 uppercase italic text-[11px]">{s.SocietyName}</h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingSocId(s.SocietyId); setNewSoc({SocietyName: s.SocietyName, Description: s.Description}) }} className="text-blue-500 hover:bg-white p-1.5 rounded-lg shadow-sm"><Edit2 size={14}/></button>
                    <button onClick={() => handleDeleteSociety(s.SocietyId)} className="text-red-500 hover:bg-white p-1.5 rounded-lg shadow-sm"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Assignments Dashboard */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border-l-4 border-slate-800">
              <h2 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><Users className="text-slate-800" size={18}/> Assign Mentor</h2>
              <div className="space-y-3">
                <select value={mentorSelection.socId} onChange={(e) => setMentorSelection({...mentorSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none">
                  <option value="">Select Society</option>
                  {societies.map(s => <option key={s.SocietyId} value={s.SocietyId}>{s.SocietyName}</option>)}
                </select>
                <select value={mentorSelection.teacherId} onChange={(e) => setMentorSelection({...mentorSelection, teacherId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none">
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.userID} value={t.userID}>{t.name}</option>)}
                </select>
                <button onClick={handleAddMentor} className="w-full bg-slate-800 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest">Add to Team</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border-l-4 border-green-600">
              <h2 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><ShieldCheck className="text-green-600" size={18}/> Appoint Society Head</h2>
              <div className="space-y-3">
                <select value={chairSelection.socId} onChange={(e) => setChairSelection({...chairSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none">
                  <option value="">Select Society</option>
                  {societies.map(s => <option key={s.SocietyId} value={s.SocietyId}>{s.SocietyName}</option>)}
                </select>
                <select value={chairSelection.teacherId} onChange={(e) => setChairSelection({...chairSelection, teacherId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none">
                  <option value="">Select Head Teacher</option>
                  {teachers.map(t => <option key={t.userID} value={t.userID}>{t.name}</option>)}
                </select>
                <button onClick={handleAddChair} className="w-full bg-green-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest">Set Chairperson</button>
              </div>
            </div>
          </div>

          {/* Cards Dashboard */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 uppercase italic mb-6">Current Session Assignments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {societies.map(soc => (
                <div key={soc.SocietyId} className="bg-slate-50 border border-slate-200 p-5 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                  <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-green-700 uppercase italic text-sm">{soc.SocietyName}</h3>
                      <p className="text-[9px] text-slate-400 uppercase font-bold italic tracking-tighter">{soc.Description || "No description provided"}</p>
                    </div>
                    <Building2 className="text-slate-200 group-hover:text-green-600 transition-colors" size={22}/>
                  </div>

                  <div className="space-y-4">
                    {/* Chairperson */}
                    <div className="bg-white p-3 rounded-2xl border-l-4 border-green-500 shadow-sm">
                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-2">Chairperson</span>
                      {soc.Chairpersons?.length > 0 ? soc.Chairpersons.map(c => (
                        <div key={c.AssignmentId} className="flex justify-between items-center bg-green-50/30 p-1.5 rounded-lg">
                          <p className="text-[11px] font-black text-slate-700 uppercase">{c.TeacherName}</p>
                          <button onClick={() => handleRemoveAssignment(c.AssignmentId)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                        </div>
                      )) : <p className="text-[10px] font-bold text-slate-300 italic">Not Assigned</p>}
                    </div>

                    {/* Mentors */}
                    <div className="bg-white p-3 rounded-2xl border-l-4 border-slate-800 shadow-sm">
                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-2">Mentors</span>
                      <div className="space-y-2">
                        {soc.Mentors?.length > 0 ? soc.Mentors.map(m => (
                          <div key={m.AssignmentId} className="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0 hover:bg-slate-50 px-1 rounded transition-colors">
                            <p className="text-[11px] font-bold text-slate-600 uppercase italic">{m.TeacherName}</p>
                            <button onClick={() => handleRemoveAssignment(m.AssignmentId)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                          </div>
                        )) : <p className="text-[10px] font-bold text-slate-300 italic">No Mentors</p>}
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