import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, BookOpen, User, Calendar } from 'lucide-react';
import DataService from '../../../services/axios';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // LocalStorage se user info (jis mein sessionName backend se aa raha hai)
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  // Dashboard se navigate hote waqt jo course data bheja tha
  const course = location.state?.course;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!course) { 
        console.error("No course data found!");
        navigate('/student-dashboard'); 
        return; 
    }
    fetchFormQuestions();
  }, [course]);

  const fetchFormQuestions = async () => {
    try {
      setLoading(true);
      const res = await DataService.get('/Student/GetActiveQuestionnaire/S');
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
    try {
      setSubmitting(true);
      const payload = {
        EnrollmentId: course.EnrollmentId,
        Answers: Object.entries(answers).map(([qId, score]) => ({ 
            QuestionId: parseInt(qId), 
            Score: score 
        }))
      };
      await DataService.post('/Student/SubmitEvaluation', payload);
      alert("Evaluation submitted successfully!");
      navigate('/student-dashboard');
    } catch (err) { 
      alert("Error submitting evaluation!"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="animate-spin text-green-600 mx-auto" size={50}/>
        <p className="mt-4 font-black text-gray-400 uppercase tracking-widest">Loading Questions...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* --- ENHANCED HEADER SECTION --- */}
      <div className="bg-white border-b-2 border-green-700 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            
            {/* Back Button & Session */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-black px-4 py-2 rounded-xl transition-all text-sm">
                <ArrowLeft size={20} className="mr-2" /> BACK
              </button>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100">
                <Calendar size={16} />
                <span className="font-black text-xs uppercase italic">{user.sessionName || 'Current Session'}</span>
              </div>
            </div>

            {/* Course & Teacher Details */}
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-700"><BookOpen size={18}/></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Course</p>
                  <p className="text-sm font-black text-gray-900 uppercase">
                    {course?.CourseCode} - {course?.CourseTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700"><User size={18}/></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Teacher name</p>
                  <p className="text-sm font-black text-gray-900 uppercase">{course?.TeacherName}</p>
                </div>
              </div>
            </div>

            {/* Student ID Badge */}
            <div className="hidden xl:block">
              <span className="bg-green-700 text-white px-4 py-2 rounded-full font-black text-xs uppercase">
                Arid no: {user.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl text-center shadow-sm border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={60} />
            <h3 className="text-xl font-bold text-gray-500 uppercase">No Questions Found</h3>
            <p className="text-gray-400 mt-2">Evaluation period might be closed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.QuestionId} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-800 mb-8 leading-tight">
                  <span className="text-green-600 mr-2">{idx + 1}.</span> {q.Text}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(val => (
                    <button 
                      key={val}
                      onClick={() => setAnswers({...answers, [q.QuestionId]: val})}
                      className={`py-4 rounded-xl border-2 font-black text-xs uppercase transition-all duration-200 ${
                        answers[q.QuestionId] === val 
                        ? 'bg-green-700 border-green-700 text-white shadow-lg' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-green-300 hover:text-green-600'
                      }`}
                    >
                      {val === 1 ? 'Poor' : val === 2 ? 'Average' : val === 3 ? 'Good' : 'Excellent'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button 
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}
              className={`w-full py-6 rounded-2xl font-black text-xl uppercase mt-10 shadow-2xl transition-all ${
                Object.keys(answers).length === questions.length 
                ? 'bg-black text-white hover:bg-green-800 transform hover:-translate-y-1' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting Data...' : 'Submit Evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;