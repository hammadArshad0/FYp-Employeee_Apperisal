import React, { useState } from 'react';
import { 
  Building2, Users, GraduationCap, Plus, 
  Trash2, Edit3, Save, LayoutDashboard, 
  CheckCircle2, UserCheck
} from 'lucide-react';

const SocietyManagement = () => {
  // --- STATES ---
  const [societies, setSocieties] = useState([
    { id: 1, name: "Programming Society", desc: "Coding & Tech Competitions" },
    { id: 2, name: "Robotics Society", desc: "Hardware & AI Projects" }
  ]);

  const [mentors, setMentors] = useState([]);
  const [chairpersons, setChairpersons] = useState([]);

  // Form Inputs States
  const [newSoc, setNewSoc] = useState({ name: '', desc: '' });
  const [mentorSelection, setMentorSelection] = useState({ socId: '', teacherId: '' });
  const [chairSelection, setChairSelection] = useState({ socId: '', studentId: '' });

  // Dummy Master Data
  const teachers = [
    { id: "T01", name: "Dr. Ahmed Khan", dept: "CS" },
    { id: "T02", name: "Ms. Sarah Ali", dept: "IT" },
    { id: "T03", name: "Mr. Hassan Raza", dept: "CS" }
  ];

  const students = [
    { id: "S01", name: "Ali Hamza", reg: "2021-AR-123" },
    { id: "S02", name: "Ayesha Bibi", reg: "2021-AR-144" },
    { id: "S03", name: "Bilal Malik", reg: "2021-AR-901" }
  ];

  // --- FUNCTIONS ---

  // 1. Add Society
  const handleAddSociety = () => {
    if (!newSoc.name) return alert("Please enter society name");
    const addedSoc = { ...newSoc, id: Date.now() };
    setSocieties([...societies, addedSoc]);
    setNewSoc({ name: '', desc: '' });
  };

  // 2. Add Mentor
  const handleAddMentor = () => {
    if (!mentorSelection.socId || !mentorSelection.teacherId) return alert("Select both Society and Teacher");
    const socName = societies.find(s => s.id === parseInt(mentorSelection.socId))?.name;
    const teacherName = teachers.find(t => t.id === mentorSelection.teacherId)?.name;
    
    const newEntry = { id: Date.now(), socName, teacherName };
    setMentors([...mentors, newEntry]);
  };

  // 3. Add Chairperson
  const handleAddChair = () => {
    if (!chairSelection.socId || !chairSelection.studentId) return alert("Select both Society and Student");
    const socName = societies.find(s => s.id === parseInt(chairSelection.socId))?.name;
    const studentName = students.find(s => s.id === chairSelection.studentId)?.name;
    
    const newEntry = { id: Date.now(), socName, studentName };
    setChairpersons([...chairpersons, newEntry]);
  };

  // 4. Delete Functions
  const deleteSociety = (id) => setSocieties(societies.filter(s => s.id !== id));
  const deleteMentor = (id) => setMentors(mentors.filter(m => m.id !== id));
  const deleteChair = (id) => setChairpersons(chairpersons.filter(c => c.id !== id));

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 md:p-10 font-sans">
      
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-8 bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border border-slate-100">
        <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg"><LayoutDashboard size={28} /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Society Management Portal</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Dashboard / Fall 2025</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        
        {/* --- SECTION 1: ADD SOCIETY --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><Building2 className="text-green-700" size={20}/> 1. Create Society</h2>
            <div className="space-y-4">
              <input value={newSoc.name} onChange={(e) => setNewSoc({...newSoc, name: e.target.value})} type="text" placeholder="Society Name" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200" />
              <textarea value={newSoc.desc} onChange={(e) => setNewSoc({...newSoc, desc: e.target.value})} placeholder="Description..." className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold outline-none h-20 resize-none focus:ring-2 focus:ring-green-200"></textarea>
              <button onClick={handleAddSociety} className="w-full bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all uppercase text-[10px] tracking-widest shadow-lg">
                <Plus size={16}/> Save Society
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Society Directory</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {societies.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-green-100 transition-all">
                    <div className="truncate pr-4">
                      <p className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{s.desc}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => deleteSociety(s.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: ASSIGN MENTORS --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><Users className="text-green-700" size={20}/> 2. Assign Mentors</h2>
            <div className="space-y-4">
              <select onChange={(e) => setMentorSelection({...mentorSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-black outline-none cursor-pointer">
                <option value="">Select Society</option>
                {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select onChange={(e) => setMentorSelection({...mentorSelection, teacherId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-black outline-none cursor-pointer">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.dept})</option>)}
              </select>
              <button onClick={handleAddMentor} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all uppercase text-[10px] tracking-widest shadow-lg">
                <UserCheck size={16}/> Confirm Mentor
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Mentors</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {mentors.length === 0 && <p className="text-[10px] text-slate-300 font-bold text-center py-4 italic uppercase tracking-widest">No mentors assigned yet</p>}
                {mentors.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-green-100 transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{m.teacherName}</p>
                      <p className="text-[9px] text-green-700 font-black uppercase tracking-widest">{m.socName}</p>
                    </div>
                    <button onClick={() => deleteMentor(m.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: ASSIGN CHAIRPERSONS --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><GraduationCap className="text-green-700" size={20}/> 3. Chairpersons</h2>
            <div className="space-y-4">
              <select onChange={(e) => setChairSelection({...chairSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-black outline-none cursor-pointer">
                <option value="">Select Society</option>
                {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select onChange={(e) => setChairSelection({...chairSelection, studentId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-black outline-none cursor-pointer">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.reg})</option>)}
              </select>
              <button onClick={handleAddChair} className="w-full bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all uppercase text-[10px] tracking-widest shadow-lg">
                <CheckCircle2 size={16}/> Assign Leadership
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Leadership List</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {chairpersons.length === 0 && <p className="text-[10px] text-slate-300 font-bold text-center py-4 italic uppercase tracking-widest">No leaders assigned yet</p>}
                {chairpersons.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-green-100 transition-all">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{c.studentName}</p>
                      <p className="text-[9px] text-green-700 font-black uppercase tracking-widest">{c.socName}</p>
                    </div>
                    <button onClick={() => deleteChair(c.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <footer className="max-w-7xl mx-auto mt-12 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">SMO Unified Resource Management • Arid University Rawalpindi</p>
      </footer>
    </div>
  );
};

export default SocietyManagement;