import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Send, ArrowLeft, Layout, Loader2, FileText } from 'lucide-react';
import DataService from '../../../services/axios';

const CreateEvaluationQuestionaire = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evalType, setEvalType] = useState("");
  const [questions, setQuestions] = useState([""]);

  const evalTypes = [
    { label: "Teacher Evaluation", value: "T" }, 
    { label: "Student Evaluation", value: "S" },
    { label: "Confidential Evaluation", value: "C" },
  ];

  const addQuestion = () => setQuestions([...questions, ""]);
  
  const updateQuestion = (index, text) => {
    const updated = [...questions];
    updated[index] = text;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!evalType) return alert("Please select evaluation type");
    if (questions.some(q => !q.trim())) return alert("Please fill all question fields.");

    try {
      setLoading(true);
      const payload = {
        EvaluationType: evalType,
        Questions: questions.filter(q => q.trim() !== "")
      };

      await DataService.post('/Questions/Create', payload);
      
      alert("Questionnaire saved successfully!");
      navigate('/director-dashboard'); 
    } catch (err) {
      const msg = err.response?.data?.Message || "Error saving questionnaire";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-green-700 font-black text-xs uppercase tracking-widest hover:text-green-800 transition-colors"
      >
        <ArrowLeft size={18}/> Back to Dashboard
      </button>

      {/* Main Form Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Banner - Same Green as Dashboard */}
        <div className="bg-green-700 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Construct Questionnaire</h1>
            <p className="text-green-50 font-medium opacity-90">Design and publish custom evaluation forms</p>
          </div>
          <FileText size={120} className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" />
        </div>

        <div className="p-10 space-y-10">
          
          {/* Type Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Select Evaluation Category</label>
            <select 
              value={evalType}
              onChange={(e) => setEvalType(e.target.value)}
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-700 focus:border-green-600 focus:bg-white outline-none transition-all appearance-none shadow-inner"
            >
              <option value="">Choose Form Type...</option>
              {evalTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-end px-1">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Questions List</label>
                <p className="text-sm font-bold text-gray-400">{questions.length} Items Added</p>
              </div>
              <button 
                onClick={addQuestion} 
                className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100"
              >
                + Add New Question
              </button>
            </div>

            {/* Questions Input Area */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <div key={idx} className="flex gap-4 group animate-in slide-in-from-left-4 duration-300">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center font-black text-green-700 flex-shrink-0 border border-green-100 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      className="w-full bg-gray-50 p-5 rounded-2xl font-bold text-gray-700 border-2 border-transparent focus:border-green-600 focus:bg-white outline-none transition-all shadow-inner"
                      value={q}
                      placeholder="Type your question here..."
                      onChange={(e) => updateQuestion(idx, e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => removeQuestion(idx)} 
                    className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Remove Question"
                  >
                    <Trash2 size={22}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <button 
              disabled={loading}
              onClick={handleSave}
              className="w-full bg-green-700 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-100 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}
              {loading ? 'UPLOADING TO SYSTEM...' : 'SAVE & PUBLISH FORM'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateEvaluationQuestionaire;