import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvaluationForm = () => {
  const { teacherId, courseCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const peerInfo = location.state?.peer || {};
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const loggedInUserId = localStorage.getItem('userId');

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ratingOptions = [
    { label: 'Poor', value: 1 }, { label: 'Average', value: 2 },
    { label: 'Good', value: 3 }, { label: 'Excellent', value: 4 }
  ];

  useEffect(() => {
    fetchPeerData();
  }, [teacherId]);

  const fetchPeerData = async () => {
    try {
      setLoading(true);
      const res = await DataService.get('/TeacherDashboard/GetActiveQuestionnaire/T'); 
      if (res.data && res.data.Questions) {
        setQuestions(res.data.Questions);
      }
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions."); return;
    }

    try {
      setSubmitting(true);
      const payload = {
        EvaluatorUserId: loggedInUserId,
        EvaluateeId: teacherId,
        CourseCode: courseCode,
        Answers: questions.map(q => ({ QuestionId: q.QuestionID, Score: answers[q.QuestionID] }))
      };
      await DataService.post('/TeacherDashboard/SubmitEvaluation', payload);
      alert("Evaluation saved!");
      navigate('/teacher-dashboard/peer');
    } catch (err) { 
      alert("Submission error!"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={50} />
      <p className="font-black text-xs uppercase tracking-widest text-gray-400">Loading Peer Questionnaire...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b-4 border-green-700 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center font-black text-gray-800 hover:text-green-700 transition-all">
            <ArrowLeft size={20} className="mr-2"/> BACK
          </button>
          
          <div className="flex flex-wrap gap-6 bg-gray-100 p-3 rounded-xl border border-gray-200">
            <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Evaluator</span><span className="text-[11px] font-black uppercase text-gray-800 italic">{user.name}</span></div>
            <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Session</span><span className="text-[11px] font-black uppercase text-green-700 italic">{peerInfo.SessionName || 'N/A'}</span></div>
            <div className="flex flex-col border-l-2 border-gray-300 pl-4"><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Reviewing Faculty</span><span className="text-[11px] font-black uppercase text-gray-800">{peerInfo.TeacherName}</span></div>
            <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Course</span><span className="text-[11px] font-black uppercase text-gray-800">{courseCode}</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 mt-12">
        {/* --- DYNAMIC CHECK: NO QUESTIONS FOUND --- */}
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center shadow-sm border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-300 mb-6" size={80} />
            <h3 className="text-2xl font-black text-gray-500 uppercase italic">Peer Evaluation Not Open</h3>
            <p className="text-gray-400 mt-2 font-bold uppercase text-xs tracking-widest">
              There are no active questions for this session at the moment.
            </p>
            <button 
              onClick={() => navigate('/teacher-dashboard')}
              className="mt-8 bg-black text-white px-10 py-4 rounded-xl font-black text-xs uppercase hover:bg-green-700 transition-all shadow-lg"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.QuestionID} className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-800 mb-6 leading-tight">
                  <span className="text-green-700 mr-2">{idx + 1}.</span> {q.QuestionText}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {ratingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers({...answers, [q.QuestionID]: opt.value})}
                      className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${
                        answers[q.QuestionID] === opt.value 
                        ? 'bg-green-700 border-green-700 text-white scale-105 shadow-lg' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-green-200 hover:text-green-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <button 
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}
              className={`w-full py-6 rounded-2xl font-black text-xl uppercase mt-10 transition-all ${
                (submitting || Object.keys(answers).length < questions.length) 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-green-700 text-white hover:bg-black active:scale-95 shadow-2xl'
              }`}
            >
              {submitting ? 'Sending...' : 'Complete Evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerEvaluationForm;