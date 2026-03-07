import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, GraduationCap, Plus, 
  Trash2, LayoutDashboard, CheckCircle2, UserCheck
} from 'lucide-react';
import DataService from '../../../services/axios';

const SocietyManagement = () => {
  // --- STATES ---
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [societies, setSocieties] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [chairpersons, setChairpersons] = useState([]);

  // Form Inputs States
  const [newSoc, setNewSoc] = useState({ name: '', desc: '' });
  const [mentorSelection, setMentorSelection] = useState({ socId: '', teacherId: '' });
  const [chairSelection, setChairSelection] = useState({ socId: '', teacherId: '' });

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const tRes = await DataService.get('/teacher/Teacherlist');
        setTeachers(tRes.data);
        
        // فرض کریں آپ کے پاس سوسائٹیز لانے کی بھی API ہے
        // const sRes = await DataService.get('/society/list');
        // setSocieties(sRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- 1. ADD SOCIETY ---
  const handleAddSociety = async () => {
    if (!newSoc.name) return alert("Please enter society name");
    
    try {
      // API Call (Backend server par save karne ke liye)
      // await DataService.post('/society/add', newSoc);
      
      const addedSoc = { ...newSoc, id: Date.now() };
      setSocieties([...societies, addedSoc]);
      setNewSoc({ name: '', desc: '' });
      alert("Society added successfully!");
    } catch (err) {
      alert("Failed to add society");
    }
  };

  // --- 2. ADD MENTOR (Teacher) ---
  const handleAddMentor = async () => {
    if (!mentorSelection.socId || !mentorSelection.teacherId) return alert("Select Society and Teacher");
    
    const soc = societies.find(s => s.id.toString() === mentorSelection.socId);
    const teacher = teachers.find(t => t.UserID === mentorSelection.teacherId);
    
    if (soc && teacher) {
      const newMentor = { id: Date.now(), socName: soc.name, teacherName: teacher.Name };
      setMentors([...mentors, newMentor]);
      alert(`Mentor ${teacher.Name} assigned to ${soc.name}`);
    }
  };

  // --- 3. ADD CHAIRPERSON (Teacher - as requested) ---
  const handleAddChair = () => {
    if (!chairSelection.socId || !chairSelection.teacherId) return alert("Select Society and Teacher for Chairperson");
    
    const soc = societies.find(s => s.id.toString() === chairSelection.socId);
    const teacher = teachers.find(t => t.UserID === chairSelection.teacherId);
    
    if (soc && teacher) {
      const newChair = { id: Date.now(), socName: soc.name, teacherName: teacher.Name };
      setChairpersons([...chairpersons, newChair]);
      alert(`Chairperson ${teacher.Name} assigned to ${soc.name}`);
    }
  };

  // --- 4. DELETE FUNCTIONS ---
  const deleteSociety = (id) => setSocieties(societies.filter(s => s.id !== id));
  const deleteMentor = (id) => setMentors(mentors.filter(m => m.id !== id));
  const deleteChair = (id) => setChairpersons(chairpersons.filter(c => c.id !== id));

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-10">
      
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-8 bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
        <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg"><LayoutDashboard size={28} /></div>
        <h1 className="text-2xl font-black text-slate-800 uppercase italic">Society Management Portal</h1>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        
        {/* 1. CREATE SOCIETY */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><Building2 className="text-green-700" size={20}/> 1. Create Society</h2>
          <input value={newSoc.name} onChange={(e) => setNewSoc({...newSoc, name: e.target.value})} type="text" placeholder="Society Name" className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 font-bold outline-none" />
          <textarea value={newSoc.desc} onChange={(e) => setNewSoc({...newSoc, desc: e.target.value})} placeholder="Description" className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 h-20 outline-none"></textarea>
          <button onClick={handleAddSociety} className="w-full bg-green-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all">
            <Plus size={16} className="inline mr-2"/> Save Society
          </button>

          {/* List of Societies */}
          <div className="mt-6 space-y-2">
            {societies.map(s => (
             <div key={s.id} className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <div>
                  <p className="text-[10px] font-black">{s.name}</p>
                  <p className="text-[8px] text-green-700 uppercase font-bold">{s.desc}</p>
                </div>
                <button onClick={() => deleteSociety(s.id)} className="text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. ASSIGN MENTORS */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><Users className="text-green-700" size={20}/> 2. Mentors</h2>
          <select value={mentorSelection.socId} onChange={(e) => setMentorSelection({...mentorSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 font-black outline-none">
            <option value="">Select Society</option>
            {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={mentorSelection.teacherId} onChange={(e) => setMentorSelection({...mentorSelection, teacherId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 font-black outline-none">
            <option value="">{loading ? "Loading..." : "Select Teacher"}</option>
            {teachers.map(t => <option key={t.UserID} value={t.UserID}>{t.Name}</option>)}
          </select>
          <button onClick={handleAddMentor} className="w-full bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg uppercase text-[10px] tracking-widest hover:bg-black transition-all">
            <UserCheck size={16} className="inline mr-2"/> Confirm Mentor
          </button>

          {/* Mentor List */}
          <div className="mt-6 space-y-2">
            {mentors.map(m => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <div>
                  <p className="text-[10px] font-black">{m.teacherName}</p>
                  <p className="text-[8px] text-green-700 uppercase font-bold">{m.socName}</p>
                </div>
                <button onClick={() => deleteMentor(m.id)} className="text-red-400"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ASSIGN CHAIRPERSONS (Teacher) */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-lg font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2"><GraduationCap className="text-green-700" size={20}/> 3. Chairpersons</h2>
          <select value={chairSelection.socId} onChange={(e) => setChairSelection({...chairSelection, socId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 font-black outline-none">
            <option value="">Select Society</option>
            {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={chairSelection.teacherId} onChange={(e) => setChairSelection({...chairSelection, teacherId: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 font-black outline-none">
            <option value="">Select Teacher (Chairperson)</option>
            {teachers.map(t => <option key={t.UserID} value={t.UserID}>{t.Name}</option>)}
          </select>
          <button onClick={handleAddChair} className="w-full bg-green-700 text-white font-black py-4 rounded-xl shadow-lg uppercase text-[10px] tracking-widest">
            <CheckCircle2 size={16} className="inline mr-2"/> Assign Chair
          </button>

          {/* Chair List */}
          <div className="mt-6 space-y-2">
            {chairpersons.map(c => (
              <div key={c.id} className="p-4 bg-green-50 rounded-2xl flex justify-between border border-green-100">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase italic">{c.teacherName}</p>
                  <p className="text-[9px] text-green-700 font-bold uppercase">{c.socName}</p>
                </div>
                <button onClick={() => deleteChair(c.id)} className="text-red-400"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SocietyManagement;