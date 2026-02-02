import React, { useState } from 'react';
import { 
  Plus, Pencil, Trash2, GraduationCap, 
  Save, AlertCircle, CheckCircle2 
} from 'lucide-react';

const MakeQuestionnaireStudent = () => {
  // Student-specific 5 questions
  const [questions, setQuestions] = useState([
    { id: 1, text: "Was the course material easy to understand and well-organized?" },
    { id: 2, text: "Did the teacher encourage students to ask questions in class?" },
    { id: 3, text: "Were the assignments and exams relevant to the course content?" },
    { id: 4, text: "How would you rate the teacher's knowledge of the subject?" },
    { id: 5, text: "Was the classroom environment conducive to learning?" }
  ]);

  const [newQuestion, setNewQuestion] = useState("");

  // Add Question Function
  const addQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, { id: Date.now(), text: newQuestion }]);
      setNewQuestion("");
    }
  };

  // Delete Question Function
  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Section (Same Green Theme) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <GraduationCap size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Student Feedback</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student Questionnaire</h2>
          <p className="text-sm text-gray-500 font-medium">Create and edit questions for student evaluation forms.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
          <span className="text-xl font-black text-green-700">{questions.length}</span>
          <span className="text-[10px] font-black text-green-600 uppercase">Questions</span>
        </div>
      </div>

      {/* Input Area (Consistent Design) */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Add a new question for student feedback..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
          <button 
            onClick={addQuestion}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100"
          >
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] px-2 text-left">Current Questionnaire Items</h3>
        
        {questions.length > 0 ? (
          questions.map((q, index) => (
            <div 
              key={q.id} 
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-black text-xs group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                  {index + 1}
                </div>
                <p className="text-gray-700 font-bold text-sm md:text-base leading-snug">
                  {q.text}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit">
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => deleteQuestion(q.id)}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold">Questionnaire is empty.</p>
          </div>
        )}
      </div>

      {/* Final Save Button */}
      {questions.length > 0 && (
        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 bg-green-700 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-green-800 transition-all shadow-xl active:scale-95">
            <CheckCircle2 size={18} /> Publish to Students
          </button>
        </div>
      )}

    </div>
  );
};

export default MakeQuestionnaireStudent;