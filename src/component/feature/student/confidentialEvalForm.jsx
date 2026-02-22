import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, User, BookOpen, Fingerprint, ShieldAlert, GraduationCap } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluationsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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
        alert("Submitted Successfully!");
        try {
            await DataService.post(`/Confidential/GenerateAndEmailReport/${user.id}`);
        } catch(e) { console.log("Email skip."); }
        navigate('/student/confidential-evaluation');
      }
    } catch (err) {
      alert("Submission Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-red-600 mb-4" size={50} />
      <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Securing Session...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- REFINED NAV BAR --- */}
      <nav className="bg-white border-b-4 border-red-600 sticky top-0 z-50 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all">
              <ArrowLeft size={24} />
            </button>
            
            {/* SUBJECT INFO PILL */}
            <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-2xl shadow-lg">
                <GraduationCap className="text-red-500" size={20} />
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{course?.CourseCode}</span>
                    <div className="hidden md:block w-[1px] h-4 bg-gray-700"></div>
                    <span className="text-red-400 font-black text-xs uppercase italic tracking-tighter">{course?.CourseTitle}</span>
                </div>
            </div>
          </div>

          {/* USER & INSTRUCTOR INFO SECTION */}
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Student ID & Session (Hidden on mobile for space) */}
            <div className="hidden md:flex items-center gap-6 border-r border-gray-100 pr-6">
               <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Arid No</p>
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">{user.id}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Session</p>
                  <p className="text-[11px] font-black text-gray-900 uppercase italic leading-none">{user.sessionName}</p>
               </div>
            </div>

            {/* Instructor Info */}
            <div className="flex flex-col items-end leading-none">
                <p className="text-[10px] font-black text-red-600 uppercase mb-1 tracking-tight">Evaluating Instructor</p>
                <p className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{course?.TeacherName}</p>
            </div>
          </div>

        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* --- DYNAMIC CHECK (FLAG 0) --- */}
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center shadow-2xl border-2 border-dashed border-gray-200 mt-10">
            <ShieldAlert className="mx-auto text-red-600 mb-6" size={80} />
            <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">
                Evaluation Not Open
            </h3>
            <p className="text-gray-400 mt-4 font-bold text-lg uppercase leading-tight">
                This portal is currently closed or <br/> confidential evaluation is not active.
            </p>
            <button 
                onClick={() => navigate('/student-dashboard')}
                className="mt-10 bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
            >
                Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-l-8 border-red-600 pl-6 mb-10">
                <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Confidential <br/> Questionnaire</h2>
            </div>

            {/* Questions Loop */}
            {questions.map((q, idx) => (
              <div key={q.QuestionId} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-start gap-5 mb-8">
                  <span className="bg-gray-900 group-hover:bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors shadow-lg">
                      {idx + 1}
                  </span>
                  <p className="font-black text-gray-800 text-xl leading-tight uppercase tracking-tight pt-1">
                      {q.Text || q.QuestionText}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers({...answers, [q.QuestionId]: val})}
                      className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 border-2 ${
                        answers[q.QuestionId] === val 
                        ? 'bg-red-600 border-red-600 text-white shadow-xl scale-105' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-red-200 hover:text-red-600'
                      }`}
                    >
                      {val === 1 ? 'Poor' : val === 2 ? 'Fair' : val === 3 ? 'Good' : 'Excellent'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}
              className={`w-full py-6 rounded-[2rem] font-black text-xl uppercase mt-10 shadow-2xl transition-all ${
                Object.keys(answers).length === questions.length 
                ? 'bg-black text-white hover:bg-red-600 transform hover:-translate-y-1' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Processing Securely...' : 'Finalize Confidential Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidentialEvaluationsForm;