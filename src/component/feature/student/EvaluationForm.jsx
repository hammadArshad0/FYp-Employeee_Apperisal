import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const course = location.state?.course;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- Naya Rating Options Array ---
  const ratingOptions = [
    { label: 'Poor', value: 1 },
    { label: 'Fair', value: 2 },
    { label: 'Average', value: 3 },
    { label: 'Good', value: 4 },
    { label: 'Excellent', value: 5 }
  ];

  useEffect(() => {
    if (!course) {
      navigate('/student-dashboard');
      return;
    }
    fetchFormQuestions();
  }, []);

  const fetchFormQuestions = async () => {
    try {
      const res = await DataService.get('/StudentEvaluation/GetEvaluationForm');
      setQuestions(res.data.Questions);
    } catch (err) {
      alert("Error loading questionnaire!");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        EnrollmentId: course.EnrollmentId,
        Answers: Object.entries(answers).map(([qId, score]) => ({
          QuestionId: parseInt(qId),
          Score: score
        }))
      };

      await DataService.post('/StudentEvaluation/SubmitEvaluation', payload);
      alert("Evaluation saved successfully!");
      navigate('/student-dashboard');
    } catch (err) {
      alert("Submission failed!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-2 hover:text-green-600 transition-colors font-medium">
          <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
        </button>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-green-600 h-full transition-all duration-500" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-2 text-green-600 font-bold text-xl mb-4"><Award /> Evaluation Details</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-gray-400 font-semibold uppercase text-[10px]">Teacher</p><p className="font-bold text-gray-700">{course.TeacherName}</p></div>
            <div><p className="text-gray-400 font-semibold uppercase text-[10px]">Course</p><p className="font-bold text-gray-700">{course.CourseCode}</p></div>
            <div><p className="text-gray-400 font-semibold uppercase text-[10px]">Student</p><p className="font-bold text-gray-700">{user?.name}</p></div>
            <div><p className="text-gray-400 font-semibold uppercase text-[10px]">Session</p><p className="font-bold text-gray-700">Fall 2025</p></div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.QuestionId} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-8">{idx + 1}. {q.Text}</h3>
              
              {/* --- Yahan Rating Labels Render Ho Rahe Hain --- */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.QuestionId] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(q.QuestionId, opt.value)}
                      className={`
                        py-4 px-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200
                        ${isSelected 
                          ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100 scale-105' 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50'
                        }
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

        <div className="mt-12 flex justify-end">
          <button 
            disabled={submitting || Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
            className={`
              flex items-center gap-2 px-12 py-4 rounded-xl font-black uppercase tracking-widest text-white transition-all transform active:scale-95
              ${Object.keys(answers).length === questions.length 
                ? 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'Submitting...' : 'Complete Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;