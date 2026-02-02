import React, { useState } from 'react';
import { 
  Plus, Pencil, Trash2, ClipboardList, 
  Save, AlertCircle, ChevronRight 
} from 'lucide-react';

const MakeQuestionnaireTeacher = () => {
  // Initial 5 questions
  const [questions, setQuestions] = useState([
    { id: 1, text: "Does the teacher communicate the course objectives clearly?" },
    { id: 2, text: "Is the teacher punctual and regular in conducting classes?" },
    { id: 3, text: "Does the teacher encourage student participation and questions?" },
    { id: 4, text: "How effectively does the teacher use teaching aids (slides, board, etc.)?" },
    { id: 5, text: "Does the teacher provide timely feedback on assignments and exams?" }
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
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <ClipboardList size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Form Management</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Teacher Questionnaire</h2>
          <p className="text-sm text-gray-500 font-medium">Manage and update questions for teacher evaluation.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
          <span className="text-xl font-black text-green-700">{questions.length}</span>
          <span className="text-[10px] font-black text-green-600 uppercase">Total Questions</span>
        </div>
      </div>

      {/* Add Question Input Area */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Type your new evaluation question here..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
          <button 
            onClick={addQuestion}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100"
          >
            <Plus size={18} /> Add Question
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] px-2">Current Questions</h3>
        
        {questions.length > 0 ? (
          questions.map((q, index) => (
            <div 
              key={q.id} 
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all"
            >
              <div className="flex items-center gap-4">
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
            <p className="text-gray-500 font-bold">No questions added yet. Start by adding one above.</p>
          </div>
        )}
      </div>

      {/* Final Actions */}
      {questions.length > 0 && (
        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 bg-green-800 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl active:scale-95">
            <Save size={18} /> Save Questionnaire
          </button>
        </div>
      )}

    </div>
  );
};

export default MakeQuestionnaireTeacher;