import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, Loader2, UserCircle } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvaluationForm = () => {
  const { teacherId, courseCode } = useParams(); // URL params
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Evaluator user from storage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const ratingOptions = [
    { label: 'Poor', value: 1 },
    { label: 'Fair', value: 2 },
    { label: 'Average', value: 3 },
    { label: 'Good', value: 4 },
    { label: 'Excellent', value: 5 }
  ];

  useEffect(() => {
    fetchPeerData();
  }, [teacherId]);

  const fetchPeerData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Peer Questions
      const res = await DataService.get('/Peer/GetPeerQuestions'); 
      setQuestions(res.data);
    } catch (err) {
      console.error("Error loading questionnaire", err);
      alert("Error loading questions!");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const loggedInUserId = localStorage.getItem('userId');
      
      // Payload according to PeerSubmissionModel DTO
      const payload = {
        EvaluatorUserId: loggedInUserId,
        EvaluateeId: teacherId,
        CourseCode: courseCode,
        Answers: questions.map(q => ({
          QuestionId: q.QuestionID,
          Score: answers[q.QuestionID]
        }))
      };

      await DataService.post('/Peer/SubmitPeerResults', payload);
      alert("Peer Evaluation saved successfully!");
      navigate('/teacher-dashboard/peer');
    } catch (err) {
      console.error("Submission failed", err);
      alert(err.response?.data?.Message || "Submission failed!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="animate-spin text-green-600" size={50} />
      <p className="text-gray-400 font-bold animate-pulse uppercase tracking-tighter">Loading Peer Form...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 1. Sticky Header & Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-20 px-6 py-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 mb-2 hover:text-green-600 transition-colors font-medium"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to List
        </button>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-green-600 h-full transition-all duration-500" 
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* 2. Top Info Card: Evaluatee Teacher Details */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                {/* <UserCircle size={120} /> */}
            </div>
          <div className="flex items-center gap-2 text-green-600 font-bold text-xl mb-4">
            <Award /> Peer Evaluation Details
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm relative z-10">
            <div>
              <p className="text-gray-400 font-semibold uppercase text-[10px]">Evaluatee ID</p>
              <p className="font-bold text-gray-700">{teacherId}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase text-[10px]">Course Code</p>
              <p className="font-bold text-gray-700">{courseCode}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase text-[10px]">Evaluator</p>
              <p className="font-bold text-gray-700">{currentUser?.name || "You"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase text-[10px]">Evaluation Type</p>
              <p className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block">Faculty Peer</p>
            </div>
          </div>
        </div>

        {/* 3. Questions Mapping */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.QuestionID} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex gap-4 mb-6">
                <span className="flex-shrink-0 w-8 h-8 bg-green-50 text-green-700 rounded-full flex items-center justify-center font-black text-sm">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-gray-800 leading-tight">
                  {q.QuestionText}
                </h3>
              </div>
              
              {/* Rating Labels */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.QuestionID] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(q.QuestionID, opt.value)}
                      className={`
                        py-4 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200
                        ${isSelected 
                          ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100 scale-105' 
                          : 'bg-white border-gray-200 text-gray-400 hover:border-green-200 hover:bg-green-50'
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

        {/* 4. Submit Footer */}
        <div className="mt-12 flex justify-end pb-12">
          <button 
            disabled={submitting || Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
            className={`
              flex items-center gap-2 px-12 py-4 rounded-xl font-black uppercase tracking-widest text-white transition-all transform active:scale-95
              ${Object.keys(answers).length === questions.length 
                ? 'bg-green-700 hover:bg-black shadow-xl shadow-green-100 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeerEvaluationForm;