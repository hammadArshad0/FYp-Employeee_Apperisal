import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Send, ArrowLeft, Loader2, FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import DataService from '../../../services/axios';

const CreateEvaluationQuestionaire = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evalType, setEvalType] = useState("");

  // Update: String array ki jagah Object array use kiya hai
  const [questions, setQuestions] = useState([{ QuestionText: "", IsCritical: false }]);

  const evalTypes = [
    { label: "Teacher Evaluation", value: "T" },
    { label: "Student Evaluation", value: "S" },
    { label: "Confidential Evaluation", value: "C" },
    { label: "Society Evaluation(chairperson)", value: "SEC" },
    { label: "Society Evaluation(Mentor)", value: "SEM" }
  ];

  const addQuestion = () => setQuestions([...questions, { QuestionText: "", IsCritical: false }]);

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].QuestionText = text;
    setQuestions(updated);
  };

  // Naya function critical status toggle karne ke liye
  const toggleCritical = (index) => {
    const updated = [...questions];
    updated[index].IsCritical = !updated[index].IsCritical;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!evalType) return alert("Please select evaluation type");
    if (questions.some(q => !q.QuestionText.trim())) return alert("Please fill all question fields.");

    try {
      setLoading(true);

      // Payload format update kiya backend compatibility ke liye
      const payload = {
        EvaluationType: evalType,
        Questions: questions.filter(q => q.QuestionText.trim() !== "")
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
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* Main Form Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">

        <div className="bg-green-700 p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Make Questionnaire</h1>
            <p className="text-green-50 font-medium opacity-90">Design evaluation forms & mark critical metrics</p>
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

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <div key={idx} className="flex gap-4 group animate-in slide-in-from-left-4 duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black flex-shrink-0 border transition-all shadow-sm ${q.IsCritical ? 'bg-red-600 text-white border-red-700' : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 relative space-y-2">
                    <input
                      className={`w-full p-5 rounded-2xl font-bold border-2 outline-none transition-all shadow-inner ${q.IsCritical ? 'bg-red-50/30 border-red-200 focus:border-red-500' : 'bg-gray-50 border-transparent focus:border-green-600 focus:bg-white'
                        }`}
                      value={q.QuestionText}
                      placeholder="Type your question here..."
                      onChange={(e) => updateQuestionText(idx, e.target.value)}
                    />

                    {/* Critical Toggle Button */}
                    {/* <button
                      onClick={() => toggleCritical(idx)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        q.IsCritical ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      {q.IsCritical ? <ShieldAlert size={14}/> : <AlertCircle size={14}/>}
                      {q.IsCritical ? 'Critical Marker Active' : 'Mark as Critical'}
                    </button> */}
                    {/* Checkbox for Critical Marker */}
                    <div className="flex items-center gap-3 mt-2 ml-1">
                      <input
                        type="checkbox"
                        id={`critical-${idx}`}
                        checked={q.IsCritical}
                        onChange={() => toggleCritical(idx)}
                        className="w-4 h-4  bg-gray-100  rounded focus:border-red-500 focus:ring-2 cursor-pointer"
                      />
                      <label
                        htmlFor={`critical-${idx}`}
                        className={`text-[10px]  uppercase tracking-widest cursor-pointer transition-colors ${q.IsCritical ? 'text-red-600' : 'text-gray-400'
                          }`}
                      >
                        {q.IsCritical ? 'Critical Question' : 'Mark as Critical'}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => removeQuestion(idx)}
                    className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Remove Question"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={loading}
              onClick={handleSave}
              className="w-full bg-green-700 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-100 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
              {loading ? 'UPLOADING TO SYSTEM...' : 'SAVE & PUBLISH FORM'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateEvaluationQuestionaire;