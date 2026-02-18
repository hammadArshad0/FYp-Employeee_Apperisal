import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, User, BookOpen, Fingerprint } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluationsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Data from navigation and localStorage
  const course = location.state?.course; 
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!course) {
      navigate('/student/confidential-evaluation');
      return;
    }
    fetchConfidentialQuestions();
  }, [course]);

  const fetchConfidentialQuestions = async () => {
    try {
      setLoading(true);
      const res = await DataService.get('/Student/GetActiveQuestionnaire/C');
      if (res.data && res.data.Questions) {
        setQuestions(res.data.Questions);
      }
    } catch (err) {
      console.error("Questions fetch error:", err);
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
      const payload = {
        EnrollmentId: parseInt(course.EnrollmentId || course.enrollmentId),
        Answers: Object.entries(answers).map(([qId, score]) => ({
          QuestionId: parseInt(qId),
          Score: parseInt(score)
        }))
      };

      const response = await DataService.post('/Confidential/SubmitConfidential', payload);
      
      if(response.status === 200) {
        alert("Confidential Evaluation Submitted Successfully!");
        
        // Auto-email report after submission
        try {
            await DataService.post(`/Confidential/GenerateAndEmailReport/${user.id}`);
        } catch(e) { console.log("Email trigger skipped."); }

        navigate('/student/confidential-evaluation');
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission Failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-red-600 mb-4" size={50} />
      <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Loading Secure Form...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* --- SECURE TOP BAR --- */}
      <div className="bg-white border-b-2 border-red-600 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center font-black text-sm uppercase hover:text-red-600 transition-colors">
            <ArrowLeft className="mr-2" size={18} /> BACK
          </button>
          
          <div className="flex flex-wrap gap-6 items-center">
            {/* Session Info */}
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <Calendar size={14} className="text-red-600" />
                <span className="text-[12px] font-black uppercase italic">{user.sessionName || 'Active Session'}</span>
            </div>
            {/* Student ID */}
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-red-700">
                {/* <Fingerprint size={14} /> */}
                <span className="text-[12px] font-black uppercase tracking-tighter">Arid no: {user.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        {/* --- COURSE & TEACHER INFO HEADER --- */}
        <div className="bg-gray-900 rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-red-500 mb-4">
                    <BookOpen size={20} />
                    <span className="font-black text-xs uppercase tracking-[0.3em]">{course?.CourseCode}</span>
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{course?.CourseTitle}</h2>
                <div className="flex items-center gap-2 text-gray-400">
                    <User size={16} />
                    <p className="text-sm font-bold uppercase tracking-widest">Teacher name: <span className="text-white">{course?.TeacherName}</span></p>
                </div>
            </div>
            {/* Decorative Icon */}
            <Fingerprint size={150} className="absolute -right-10 -bottom-10 text-white opacity-5" />
        </div>

        {/* --- QUESTIONS SECTION --- */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.QuestionId} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <span className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                    {idx + 1}
                </span>
                <p className="font-black text-gray-800 text-lg leading-tight uppercase tracking-tight">
                    {q.Text || q.QuestionText}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswers({...answers, [q.QuestionId]: val})}
                    className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all duration-200 border-2 ${
                      answers[q.QuestionId] === val 
                      ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-400 border-gray-50 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    {val === 1 ? 'Poor' : val === 2 ? 'Fair' : val === 3 ? 'Good' : 'Excellent'}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* --- SUBMIT BUTTON --- */}
          <button
            disabled={submitting || Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
            className={`w-full py-6 rounded-2xl font-black text-xl uppercase mt-10 shadow-2xl transition-all ${
              Object.keys(answers).length === questions.length 
              ? 'bg-black text-white hover:bg-red-700 transform hover:-translate-y-1' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Processing Securely...</span>
                </div>
            ) : (
                'Finalize Confidential Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialEvaluationsForm;