import React, { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, ClipboardList, 
  Save, AlertCircle, Loader2, CheckCircle2, X
} from 'lucide-react';
import DataService from '../../../services/axios';

const MakeQuestionnaireTeacher = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // 1. Fetch existing Teacher questions ('T')
  useEffect(() => {
    fetchTeacherQuestions();
  }, []);

  const fetchTeacherQuestions = async () => {
    try {
      const res = await DataService.get('/Questions/GetQuestions');
      // Filter only Teacher types if your API doesn't do it
      const teacherData = res.data.filter(q => q.type === 'T');
      setQuestions(teacherData);
    } catch (err) { console.error(err); }
  };

  // 2. Add Locally
  const addQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, { 
        id: Date.now(), 
        question: newQuestion, 
        isNew: true, 
        type: 'T' 
      }]);
      setNewQuestion("");
    }
  };

  // 3. Delete from DB or Local
  const handleDelete = async (id, isNew) => {
    if (isNew) {
      setQuestions(questions.filter(q => q.id !== id));
      return;
    }
    if(!window.confirm("Delete this question?")) return;
    try {
      setLoading(true);
      await DataService.delete(`/Questions/DeleteQuestion/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      setMessage({ type: 'success', text: 'Deleted successfully!' });
    } catch (err) { setMessage({ type: 'error', text: 'Delete failed!' }); }
    finally { setLoading(false); }
  };

  // 4. Update in DB
  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      await DataService.put('/Questions/UpdateQuestion', { id, question: editText, type: 'T' });
      setQuestions(questions.map(q => q.id === id ? { ...q, question: editText } : q));
      setEditingId(null);
      setMessage({ type: 'success', text: 'Updated!' });
    } catch (err) { setMessage({ type: 'error', text: 'Update failed!' }); }
    finally { setLoading(false); }
  };

  // 5. Publish New Questions
  const handlePublish = async () => {
    const unpublished = questions.filter(q => q.isNew);
    if (unpublished.length === 0) return;

    try {
      setLoading(true);
      const payload = unpublished.map(q => ({ question: q.question, type: 'T' }));
      await DataService.post('/Questions/AddQuestions', payload);
      fetchTeacherQuestions();
      setMessage({ type: 'success', text: 'Teacher questionnaire published!' });
    } catch (err) { setMessage({ type: 'error', text: 'Publish failed!' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-bold text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <ClipboardList size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Form Management</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Teacher Questionnaire</h2>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
          <span className="text-xl font-black text-green-700">{questions.length}</span>
          <span className="text-[10px] font-black text-green-600 ml-2">QUESTIONS</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" placeholder="Type teacher evaluation question..."
            value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
          <button onClick={addQuestion} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-green-700">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-gray-300 font-black">{index + 1}</span>
              {editingId === q.id ? (
                <input 
                    autoFocus className="flex-1 border-b-2 border-green-500 outline-none"
                    value={editText} onChange={(e) => setEditText(e.target.value)}
                />
              ) : (
                <p className="text-gray-700 font-bold">{q.question} {q.isNew && <span className="text-[9px] text-blue-500 ml-2">(Unpublished)</span>}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingId === q.id ? (
                <button onClick={() => handleUpdate(q.id)} className="text-green-600 p-2"><Save size={18}/></button>
              ) : (
                <>
                  {!q.isNew && <button onClick={() => {setEditingId(q.id); setEditText(q.question);}} className="text-blue-600 p-2"><Pencil size={18}/></button>}
                  <button onClick={() => handleDelete(q.id, q.isNew)} className="text-red-500 p-2"><Trash2 size={18}/></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button 
            onClick={handlePublish}
            disabled={loading || !questions.some(q => q.isNew)}
            className="bg-green-800 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-xl disabled:bg-gray-300"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
          Save Questions
        </button>
      </div>
    </div>
  );
};

export default MakeQuestionnaireTeacher;