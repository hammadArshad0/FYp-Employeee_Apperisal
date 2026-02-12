import React, { useState, useEffect } from 'react';
import { 
  Lock, Plus, Pencil, Trash2, ShieldCheck, 
  Save, AlertCircle, Loader2, CheckCircle2, X 
} from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluations = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

 
  useEffect(() => {
    fetchConfidentialQuestions();
  }, []);

  const fetchConfidentialQuestions = async () => {
    try {
      const res = await DataService.get('/Questions/GetQuestions');
    
      const confidentialData = res.data.filter(q => q.type === 'C');
      setQuestions(confidentialData);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };


  const addLocalQuestion = () => {
    if (!newQuestion.trim()) return;
    const tempObj = { 
      id: Date.now(), 
      question: newQuestion, 
      type: 'C', 
      isNew: true 
    };
    setQuestions([...questions, tempObj]);
    setNewQuestion("");
  };


  const handleDelete = async (id, isNew) => {
    if (isNew) {
      setQuestions(questions.filter(q => q.id !== id));
      return;
    }
    if (!window.confirm("Kya aap ye confidential sawaal delete karna chahte hain?")) return;
    try {
      setLoading(true);
      await DataService.delete(`/Questions/DeleteQuestion/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      showToast('success', 'Sawaal delete ho gaya!');
    } catch (err) {
      showToast('error', 'Delete fail ho gaya!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      await DataService.put('/Questions/UpdateQuestion', { 
        id, 
        question: editText, 
        type: 'C' 
      });
      setQuestions(questions.map(q => q.id === id ? { ...q, question: editText } : q));
      setEditingId(null);
      showToast('success', 'Sawaal update ho gaya!');
    } catch (err) {
      showToast('error', 'Update fail ho gaya!');
    } finally {
      setLoading(false);
    }
  };

  // 5. POST: Publish new questions to DB
  const handlePublish = async () => {
    const unpublished = questions.filter(q => q.isNew);
    if (unpublished.length === 0) return;

    try {
      setLoading(true);
      const payload = unpublished.map(q => ({ 
        question: q.question, 
        type: 'C' 
      }));
      await DataService.post('/Questions/AddQuestions', payload);
      fetchConfidentialQuestions(); // Refresh list from DB
      showToast('success', 'Naye sawaalat save ho gaye!');
    } catch (err) {
      showToast('error', 'Publishing fail ho gayi!');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Toast Message
  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      
      {/* Notification Message */}
      {message.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-bounce ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-green-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-green-300 mb-2">
            <Lock size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Confidential Control</span>
          </div>
          <h2 className="text-3xl font-black">Confidential Evaluation</h2>
          {/* <p className="text-green-100 mt-2 opacity-80">Add or edit Confidential evaluation criteria for reviews.</p> */}
        </div>
      </div>

      {/* Add Input Area */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-500 transition-all">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Naya confidential criteria likhein..." 
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-green-600 outline-none font-medium"
          />
          <button 
            onClick={addLocalQuestion}
            className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Plus size={20} /> Add New question
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Confidential Questions</h3>
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full">TYPE: C</span>
        </div>

        <div className="divide-y divide-gray-100">
          {questions.length > 0 ? (
            questions.map((q, index) => (
              <div key={q.id} className="p-6 flex items-center justify-between group hover:bg-green-50/30 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-gray-300 font-black text-xl">{index + 1}</span>
                  {editingId === q.id ? (
                    <input 
                      autoFocus
                      className="flex-1 border-b-2 border-green-600 outline-none py-1 bg-transparent font-bold text-gray-800"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <p className="font-bold text-gray-700 text-lg">{q.question}</p>
                      {q.isNew && <span className="text-[10px] text-blue-500 font-black italic">Not Published Yet</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {editingId === q.id ? (
                    <>
                      <button onClick={() => handleUpdate(q.id)} className="text-green-600 p-2 hover:bg-green-100 rounded-lg"><Save size={20}/></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
                    </>
                  ) : (
                    <>
                      {!q.isNew && (
                        <button 
                          onClick={() => { setEditingId(q.id); setEditText(q.question); }} 
                          className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(q.id, q.isNew)} 
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-gray-400 font-bold">List khali hai. Naya sawaal add karein.</div>
          )}
        </div>
      </div>

  
      <div className="flex justify-end pt-4">
        <button 
          onClick={handlePublish}
          disabled={loading || !questions.some(q => q.isNew)}
          className="bg-green-900 text-white px-12 py-5 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-black disabled:bg-gray-300 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20} />}
          Save  Changes
        </button>
      </div>

    </div>
  );
};

export default ConfidentialEvaluations;