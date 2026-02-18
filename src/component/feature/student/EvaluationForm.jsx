import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import DataService from '../../../services/axios';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const course = location.state?.course;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!course) { 
        console.error("No course data found in navigation state!");
        navigate('/student-dashboard'); 
        return; 
    }
    fetchFormQuestions();
  }, [course]);

  const fetchFormQuestions = async () => {
    try {
      setLoading(true);
      // Type 'S' for Student Evaluation
      const res = await DataService.get('/Student/GetActiveQuestionnaire/S');
      
      console.log("API Response for Type S:", res.data);

      if (res.data && res.data.Questions && res.data.Questions.length > 0) {
        setQuestions(res.data.Questions);
      } else {
        setQuestions([]);
      }
    } catch (err) { 
      console.error("Fetch Error:", err.response?.data || err.message); 
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
      alert("Evaluation saved successfully!");
      navigate('/student-dashboard');
    } catch (err) { 
      alert("Error submitting evaluation!"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={50}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header Section */}
      <div className="bg-white border-b-2 border-green-700 shadow-sm sticky top-0 z-20 px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-700 font-black text-lg hover:text-green-600 transition-colors">
            <ArrowLeft size={24} className="mr-2" /> BACK
          </button>
          
          <div className="flex flex-wrap gap-x-12 gap-y-3 text-sm font-black uppercase text-gray-500">
            <div>STUDENT: <span className="text-gray-900">{user.name}</span></div>
            <div>COURSE: <span className="text-green-600">{course?.CourseTitle}</span></div>
            <div>TEACHER: <span className="text-gray-900">{course?.TeacherName}</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-12">
        {questions.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl text-center shadow-sm border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={60} />
            <h3 className="text-xl font-bold text-gray-500 uppercase">No Active Questions Found for Type 'S'</h3>
            <p className="text-gray-400 mt-2">Please check database flag and type.</p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {questions.map((q, idx) => (
                <div key={q.QuestionId} className="bg-white p-10 rounded-2xl border-2 border-gray-100 shadow-md">
                  <h3 className="text-xl font-black text-gray-800 mb-8">
                    <span className="text-green-600 mr-2">{idx + 1}.</span> {q.Text}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(val => (
                      <button 
                        key={val}
                        onClick={() => setAnswers({...answers, [q.QuestionId]: val})}
                        className={`py-5 rounded-2xl border-2 font-black text-sm uppercase transition-all ${
                          answers[q.QuestionId] === val 
                          ? 'bg-green-600 border-green-600 text-white shadow-xl scale-105' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-green-300'
                        }`}
                      >
                        {val === 1 ? 'Poor' : val === 2 ? 'Average' : val === 3 ? 'Good' : 'Excellent'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}
              className={`w-full py-6 rounded-2xl font-black text-xl uppercase mt-12 shadow-2xl transition-all ${
                Object.keys(answers).length === questions.length 
                ? 'bg-green-700 text-white hover:bg-black' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Complete Evaluation'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;