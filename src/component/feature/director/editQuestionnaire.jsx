import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, ArrowLeft, Edit, AlertCircle, Plus, Loader2, FileEdit } from 'lucide-react';
import DataService from '../../../services/axios';

const EditEvaluationQuestionnaire = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [evaluationType, setEvaluationType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await DataService.get(`/Questions/GetById/${id}`);
      
      if (res.data) {
        setEvaluationType(res.data.evaluationType || "");
        const formattedQuestions = (res.data.questions || []).map(q => ({
          id: q.id,
          questionText: q.questionText
        }));
        setQuestions(formattedQuestions);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Data load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: 0, questionText: '' }]);
  };

  const updateQuestion = (index, text) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    const target = questions[index];
    if (target.id !== 0) {
      setDeletedIds([...deletedIds, target.id]);
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    if (questions.some(q => !q.questionText.trim())) {
      alert("Tamam sawalat likhna zaroori hain.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        QuestionnaireId: parseInt(id),
        Questions: questions.map(q => ({
          Id: q.id,
          QuestionText: q.questionText
        })),
        DeletedIds: deletedIds
      };
      
      await DataService.post('/Questions/SaveAllChanges', payload);
      alert("Changes saved successfully!");
      navigate('/director-dashboard/make-questionnaire');
    } catch (err) {
      console.error("Save Error:", err);
      alert(err.response?.data?.Message || "Update fail ho gaya.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="w-12 h-12 text-green-700 animate-spin" />
      <div className="text-xl font-black text-green-700 uppercase tracking-tighter italic">Fetching Data...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-green-700 font-black text-xs uppercase tracking-widest hover:text-green-800 transition-colors"
      >
        <ArrowLeft size={18}/> BACK TO LIST
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Banner - Matching Theme */}
        <div className="bg-green-700 p-10 text-white flex justify-between items-end relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-green-200 mb-2">
              <Edit size={18}/> 
              <span className="text-xs font-black uppercase tracking-widest">Editor Mode</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Edit Questionnaire</h1>
            <p className="text-green-50 font-medium opacity-80">Update existing evaluation parameters</p>
          </div>
          <div className="text-right relative z-10">
            <p className="text-green-200 text-[10px] font-black uppercase tracking-widest opacity-60">System ID</p>
            <p className="text-3xl font-black text-white italic">#{id}</p>
          </div>
          <FileEdit size={140} className="absolute -right-6 -bottom-6 text-white opacity-10 rotate-12" />
        </div>

        <div className="p-10 space-y-10">
          {/* Category Info Box */}
          <div className="flex items-center justify-between p-6 bg-green-50 rounded-3xl border border-green-100">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-green-700">
                  <AlertCircle size={28}/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest mb-1">Active Category</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tight">
                    {evaluationType === 'T' ? 'Teacher Evaluation' : evaluationType === 'S' ? 'Student Evaluation' : 'Confidential Report'}
                  </p>
                </div>
              </div>
          </div>

          {/* Question Management */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions Management</h3>
              <button 
                onClick={addQuestion} 
                className="flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-green-800 transition-all shadow-lg shadow-green-100"
              >
                <Plus size={16}/> ADD NEW LINE
              </button>
            </div>

            {/* List of Questions */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <div key={idx} className="group flex items-center gap-5 bg-gray-50 p-4 pr-6 rounded-2xl border-2 border-transparent hover:border-green-200 hover:bg-white transition-all shadow-inner hover:shadow-md">
                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded-xl flex items-center justify-center font-black text-green-700 border border-gray-100 shadow-sm">
                    {idx + 1}
                  </div>
                  <input 
                    className="flex-1 bg-transparent py-2 font-bold text-gray-700 outline-none text-lg placeholder:text-gray-300"
                    placeholder="Type question content here..."
                    value={q.questionText}
                    onChange={(e) => updateQuestion(idx, e.target.value)}
                  />
                  <button 
                    onClick={() => deleteQuestion(idx)} 
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={22}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 pt-10 border-t border-gray-100">
            <button 
              onClick={() => navigate(-1)} 
              className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Discard Changes
            </button>
            <button 
              disabled={saving}
              onClick={handleSaveChanges} 
              className="flex-[2] bg-green-700 text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-green-800 shadow-xl shadow-green-100 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
              {saving ? 'UPDATING...' : 'SAVE ALL CHANGES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEvaluationQuestionnaire;