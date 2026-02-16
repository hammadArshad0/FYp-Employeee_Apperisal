import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvaluationForm = () => {
  const { teacherId, courseCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dashboard se navigate hote waqt jo state pass hui thi
  const peerInfo = location.state?.peer || {};
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const loggedInUserId = localStorage.getItem('userId');

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ratingOptions = [
    { label: 'Poor', value: 1 },
    { label: 'Average', value: 2 },
    { label: 'Good', value: 3 },
    { label: 'Excellent', value: 4 }
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
      console.error("Error loading questionnaire:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = questions.map(q => ({
        evaluatorID: loggedInUserId,
        evaluateeID: teacherId,
        questionID: q.QuestionID,
        courseCode: courseCode,
        score: answers[q.QuestionID]
      }));

      await DataService.post('/TeacherDashboard/SubmitEvaluation', payload);
      alert("Peer evaluation submitted successfully!");
      navigate('/teacher-dashboard/peer');
    } catch (err) {
      alert("Submission failed!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={50} />
      <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Questionnaire...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* --- HORIZONTAL INFO HEADER (GREEN THEME) --- */}
      <div className="bg-white border-b-2 border-green-700 shadow-sm sticky top-0 z-50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-700 font-black text-lg hover:text-green-700 transition-colors"
          >
            <ArrowLeft size={24} className="mr-2" /> BACK
          </button>
          
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-[11px] font-black uppercase tracking-tight text-gray-500">
            <div className="flex gap-2">EVALUATOR: <span className="text-gray-900">{user.name}</span></div>
            {/* <div className="flex gap-2">SESSION: <span className="text-gray-900">{peerInfo.Session || 'FALL 2025'}</span></div> */}
            <div className="flex gap-2">FACULTY: <span className="text-gray-900">{peerInfo.TeacherName || 'N/A'}</span></div>
            {/* <div className="flex gap-2">COURSE: <span className="text-green-700">{courseCode} - {peerInfo.CourseName || 'N/A'}</span></div> */}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-12">
       

        {/* --- QUESTIONS AREA --- */}
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.QuestionID} className="bg-white p-10 rounded-2xl border-2 border-gray-100 shadow-md transition-all hover:border-green-100">
              <h3 className="text-xl font-black text-gray-800 mb-8 leading-snug">
                <span className="text-green-700 mr-2">{idx + 1}.</span> {q.QuestionText}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.QuestionID] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers({...answers, [q.QuestionID]: opt.value})}
                      className={`
                        py-5 rounded-2xl border-2 font-black text-sm uppercase transition-all duration-200
                        ${isSelected 
                          ? 'bg-green-700 border-green-700 text-white scale-105 shadow-xl' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-green-300 hover:bg-green-50'}
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <button 
          disabled={submitting || Object.keys(answers).length < questions.length}
          onClick={handleSubmit}
          className={`
            w-full py-6 rounded-2xl font-black text-xl uppercase mt-12 shadow-2xl transition-all
            ${Object.keys(answers).length === questions.length 
              ? 'bg-green-700 text-white hover:bg-black active:scale-95' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={24} /> Processing...
            </div>
          ) : (
            'Complete Peer Review'
          )}
        </button>
        
        <p className="text-center mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest italic">
            {Object.keys(answers).length} of {questions.length} Questions Answered
        </p>
      </div>
    </div>
  );
};

export default PeerEvaluationForm;