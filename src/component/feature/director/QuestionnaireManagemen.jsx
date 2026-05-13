import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Power, PowerOff, ClipboardList, Edit3, HelpCircle, 
  Loader2, Trash2, Archive, Activity, ChevronDown
} from 'lucide-react';
import DataService from '../../../services/axios';

const MakeQuestionaire = () => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false); // ← NEW
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This will permanently delete the questionnaire and all associated questions.")) {
      try {
        const res = await DataService.delete(`/Questions/Delete/${id}`);
        if (res.status === 200) {
          setQuestionnaires(prev => prev.filter(q => q.Id !== id));
          alert("Deleted successfully!");
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("Delete failed: " + (err.response?.data?.message || "Server Error"));
      }
    }
  };

  const toggleStatus = async (item) => {
    try {
      const payload = { QuestionnaireId: item.Id, TurnOn: item.Flag !== "1" };
      await DataService.post('/Questions/Toggle', payload);
      fetchAll(); 
    } catch (err) {
      alert(err.response?.data?.Message || "Only one questionnaire of this type can be active.");
    }
  };

  const getTypeName = (type) => {
    const types = {
      'T': 'Teacher Evaluation',
      'S': 'Student Evaluation',
      'C': 'Confidential Report',
      'SEC': 'Society Evaluation (Chairperson)',
      'SEM': 'Society Evaluation (Mentor)'
    };
    return types[type] || 'General Questionnaire';
  };

  const activeForms = questionnaires.filter(q => q.Flag === "1");
  const archivedForms = questionnaires.filter(q => q.Flag !== "1");

  const RenderCard = (q) => (
    <div key={q.Id} className={`group relative bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 hover:shadow-2xl ${q.Flag === "1" ? 'border-green-600 shadow-xl' : 'border-gray-100 opacity-90'}`}>
      <div className="flex justify-between items-start mb-6">
         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${q.Flag === "1" ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
           {q.Flag === "1" ? '● Active' : '○ Archived'}
         </div>
         <div className="flex gap-2">
            {/* <button 
              onClick={() => navigate(`/director-dashboard/edit/${q.Id}`)} 
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100"
              title="Edit Questionnaire"
            >
              <Edit3 size={18}/>
            </button> */}
            <button 
  onClick={() => {
    if (q.Flag !== "1") {
      navigate(`/director-dashboard/edit/${q.Id}`);
    }
  }}
  disabled={q.Flag === "1"}
  className={`p-2.5 rounded-xl transition-all border ${
    q.Flag === "1"
      ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-100'
      : 'bg-gray-50 text-gray-400 hover:text-blue-600 border-transparent hover:border-blue-100'
  }`}
  title={
    q.Flag === "1"
      ? "Active questionnaire cannot be edited"
      : "Edit Questionnaire"
  }
>
  <Edit3 size={18}/>
</button>
            <button 
              onClick={() => handleDelete(q.Id)} 
              className="p-2.5 bg-gray-100 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
              title="Delete Permanently"
            >
              {/* <Trash2 size={18}/> */}
            </button>
         </div>
      </div>

      <div className="space-y-2 mb-8">
        <h2 className="text-xl font-black text-gray-800 leading-tight uppercase italic">{getTypeName(q.Type)}</h2>
        <div className="flex items-center gap-2 text-green-600 font-black text-[9px] uppercase tracking-widest bg-green-50 w-fit px-3 py-1 rounded-lg">
          <HelpCircle size={12}/> <span>{q.QuestionCount} Questions</span>
        </div>
      </div>

      <button onClick={() => toggleStatus(q)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${q.Flag === "1" ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white' : 'bg-green-700 text-white hover:bg-green-800'}`}>
        {q.Flag === "1" ? <PowerOff size={16}/> : <Power size={16}/>}
        {q.Flag === "1" ? 'Deactivate' : 'Publish Live'}
      </button>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="bg-green-700 rounded-[2.5rem] p-10 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <ClipboardList size={40} className="text-white opacity-50"/>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Questionnaire Manager</h1>
            <p className="text-green-100 font-bold uppercase text-[10px] tracking-widest">Manage Evaluations & Feedback Forms</p>
          </div>
        </div>
        <button onClick={() => navigate('/director-dashboard/add-new')} className="relative z-10 bg-white text-green-700 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl whitespace-nowrap">
          <Plus size={20}/> NEW FORM
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
          <div className="font-black text-gray-300 text-xs tracking-widest uppercase">Fetching Data...</div>
        </div>
      ) : (
        <>
          {/* Active List */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Activity className="text-green-600" size={24}/>
              <h3 className="font-black text-gray-800 uppercase italic tracking-tighter text-lg">Live Questionnaires</h3>
            </div>
            {activeForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeForms.map(RenderCard)}
              </div>
            ) : (
              <div className="p-16 border-4 border-dashed border-gray-50 rounded-[3rem] text-center">
                <p className="text-gray-300 font-black uppercase text-sm tracking-widest">No Active Evaluations</p>
              </div>
            )}
          </section>

          {/* ── Archived List (Collapsible) ── */}
          <section className="pt-10 border-t border-gray-50 space-y-6">

            {/* Clickable Header */}
            <button
              onClick={() => setArchiveOpen(!archiveOpen)}
              className="w-full flex items-center justify-between border-b border-gray-100 pb-4"
            >
              <div className="flex items-center gap-3">
                <Archive className="text-gray-400" size={32}/>
                <h3 className="font-black text-white p-4 border-2 bg-green-700 rounded-lg  uppercase italic tracking-tighter text-lg">
                  Drafts & Archived
                </h3>
                {/* Count Badge */}
                <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                  {archivedForms.length}
                </span>
              </div>
              {/* Arrow — rotate when open */}
              <ChevronDown 
                size={20} 
                className={`text-gray-300 transition-transform duration-300 ${archiveOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Cards — sirf tab dikhenge jab archiveOpen = true */}
            {archiveOpen && (
              archivedForms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {archivedForms.map(RenderCard)}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-300 font-bold uppercase text-[10px]">
                  No archived forms found.
                </div>
              )
            )}

          </section>
        </>
      )}
    </div>
  );
};

export default MakeQuestionaire;