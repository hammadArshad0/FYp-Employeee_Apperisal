import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
      alert("Please answer all questions.");
      return;
    }

    try {
      setSubmitting(true);
      
      // Data structure exactly match with DTO
      const payload = {
        EnrollmentId: parseInt(course.EnrollmentId || course.enrollmentId),
        Answers: Object.entries(answers).map(([qId, score]) => ({
          QuestionId: parseInt(qId),
          Score: parseInt(score)
        }))
      };

      console.log("Sending Payload:", payload);

      const response = await DataService.post('/Confidential/SubmitConfidential', payload);
      
      if(response.status === 200) {
        alert("Evaluation Submitted Successfully!");
        
        // Option: Submit ke foran baad report bhejein
        try {
            await DataService.post(`/Confidential/GenerateAndEmailReport/${user.id}`);
        } catch(e) { console.log("Email error:", e); }

        navigate('/student/confidential-evaluation');
      }
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      alert("Submission Failed: " + (err.response?.data?.Message || "Check Console"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-red-600" size={40} />
      <span className="ml-2 font-bold uppercase text-xs">Loading Form...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-10">
      <button onClick={() => navigate(-1)} className="flex items-center font-black mb-10 hover:text-red-600 transition-colors">
        <ArrowLeft className="mr-2" /> BACK
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-red-600 text-white p-6 rounded-t-3xl">
          <h2 className="text-2xl font-black uppercase italic">Confidential: {course?.TeacherName}</h2>
          <p className="text-xs font-bold uppercase tracking-widest">{course?.CourseTitle}</p>
        </div>

        <div className="bg-gray-50 p-8 border rounded-b-3xl space-y-8">
          {questions.map((q, idx) => (
            <div key={q.QuestionId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="font-black text-gray-800 mb-4">{idx+1}. {q.Text || q.QuestionText}</p>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswers({...answers, [q.QuestionId]: val})}
                    className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                      answers[q.QuestionId] === val ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-50'
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
            className={`w-full py-5 rounded-2xl font-black text-lg uppercase shadow-xl transition-all ${
              Object.keys(answers).length === questions.length ? 'bg-black text-white hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Processing...' : 'Confirm Submission'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialEvaluationsForm;