import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Power, PowerOff, ClipboardList, Edit3, HelpCircle, Loader2, LayoutGrid } from 'lucide-react';
import DataService from '../../../services/axios';

const MakeQuestionaire = () => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { 
    fetchAll(); 
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await DataService.get('/Questions/GetAll');
      setQuestionnaires(res.data);
    } catch (err) { 
      console.error("Fetch error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleStatus = async (item) => {
    try {
      const payload = {
        QuestionnaireId: item.Id,
        TurnOn: item.Flag !== "1"
      };
      
      await DataService.post('/Questions/Toggle', payload);
      
      setQuestionnaires(prev => prev.map(q => 
        q.Id === item.Id ? { ...q, Flag: item.Flag === "1" ? "0" : "1" } : q
      ));
      
      fetchAll(); 
    } catch (err) {
      alert(err.response?.data?.Message || "Toggle Failed. Only one type can be active.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Dashboard Header Banner */}
      <div className="bg-green-700 rounded-[2.5rem] p-10 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
            <ClipboardList size={40} className="text-white"/>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Evaluations</h1>
            <p className="text-green-100 font-bold uppercase text-xs tracking-[0.3em] opacity-80">Form Deployment Center</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/director-dashboard/add-new')}
          className="relative z-10 bg-white text-green-700 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-green-50 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          <Plus size={20}/> CREATE NEW FORM
        </button>
        <LayoutGrid size={180} className="absolute -right-10 -bottom-10 text-white opacity-10 rotate-12" />
      </div>

      {/* 2. Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="animate-spin text-green-700" size={50} />
          <div className="font-black text-gray-300 tracking-[0.3em] text-sm">LOADING DATABASE...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {questionnaires.map((q) => (
            <div 
              key={q.Id} 
              className={`group relative bg-white rounded-[3.5rem] p-10 border-2 transition-all duration-500 hover:shadow-2xl ${
                q.Flag === "1" ? 'border-green-600 shadow-xl' : 'border-gray-100 opacity-90'
              }`}
            >
              {/* Status Badge & Edit */}
              <div className="flex justify-between items-start mb-8">
                 <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${
                   q.Flag === "1" ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                 }`}>
                   {q.Flag === "1" ? '● System Active' : '○ Offline Mode'}
                 </div>
                 <button 
                   onClick={() => navigate(`/director-dashboard/edit/${q.Id}`)}
                   className="p-3 bg-gray-50 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-2xl transition-all border border-transparent hover:border-green-100"
                 >
                   <Edit3 size={20}/>
                 </button>
              </div>

              {/* Title & Count */}
              <div className="space-y-3 mb-10">
                <h2 className="text-2xl font-black text-gray-800 leading-tight">
                  {q.Type === 'T' ? 'Teacher Evaluation' : q.Type === 'S' ? 'Student Evaluation' : 'Confidential Report'}
                </h2>
                <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-widest bg-green-50 w-fit px-3 py-1 rounded-lg border border-green-100">
                  <HelpCircle size={14}/>
                  <span>{q.QuestionCount} Questions</span>
                </div>
              </div>

              {/* Main Toggle Button */}
              <button 
                onClick={() => toggleStatus(q)}
                className={`w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                  q.Flag === "1" 
                  ? 'bg-white text-red-500 border-2 border-red-50 hover:bg-red-500 hover:text-white hover:shadow-red-100' 
                  : 'bg-green-700 text-white border-2 border-transparent hover:bg-green-800 hover:shadow-green-100'
                }`}
              >
                {q.Flag === "1" ? <PowerOff size={18}/> : <Power size={18}/>}
                {q.Flag === "1" ? 'Deactivate Form' : 'Publish to Live'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer Hint */}
      {!loading && questionnaires.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
           <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Questionnaires found in system.</p>
        </div>
      )}
    </div>
  );
};

export default MakeQuestionaire;