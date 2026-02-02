
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Calendar, BookOpen, Award, CheckCircle } from 'lucide-react';

const EvaluationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  

  const user = JSON.parse(localStorage.getItem('user'));
  const course = location.state?.course || { 
    code: 'CS-000', 
    name: 'Unknown Course', 
    instructor: 'Unknown Instructor' 
  };

  const [answers, setAnswers] = useState({});
  const [progress, setProgress] = useState(0);

  // 2. Define Questions and Rating Options
  const questions = [
    { id: 1, text: "The instructor came to class on time and prepared." },
    { id: 2, text: "The instructor explained complex concepts clearly." },
    { id: 3, text: "The instructor encouraged questions and participation." },
    { id: 4, text: "Assignments and exams were graded fairly." },
    { id: 5, text: "The course material was organized and easy to follow." },
    { id: 6, text: "Overall, I am satisfied with the instructor's performance." },
  ];

  const ratingOptions = [
    { label: 'Poor', value: 1, color: 'hover:bg-red-50 hover:border-red-200' },
    { label: 'Fair', value: 2, color: 'hover:bg-orange-50 hover:border-orange-200' },
    { label: 'Average', value: 3, color: 'hover:bg-yellow-50 hover:border-yellow-200' },
    { label: 'Good', value: 4, color: 'hover:bg-blue-50 hover:border-blue-200' },
    { label: 'Excellent', value: 5, color: 'hover:bg-green-50 hover:border-green-200' }
  ];

  // 3. Update Progress Bar
  useEffect(() => {
    const answeredCount = Object.keys(answers).length;
    const total = questions.length;
    setProgress(Math.round((answeredCount / total) * 100));
  }, [answers]);

  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    alert("Evaluation Submitted Successfully!");
    navigate('/student-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* --- 1. Header & Navigation --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-500 hover:text-green-700 transition-colors font-medium mb-4"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
          </button>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-gray-400 font-medium mt-1">{progress}% Completed</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* --- 2. Information Card (Student, Teacher, Session) --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="text-green-200" />
              Teacher Evaluation Form
            </h1>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Student Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Student</p>
                <p className="font-semibold text-gray-800">{user?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Session */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Session</p>
                <p className="font-semibold text-gray-800">Fall 2025</p>
              </div>
            </div>

             {/* Instructor */}
             <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Teacher</p>
                <p className="font-semibold text-gray-800">{course.instructor}</p>
              </div>
            </div>

            {/* Course */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Course</p>
                <p className="font-semibold text-gray-800 truncate" title={course.name}>{course.code}</p>
              </div>
            </div>

          </div>
        </div>

        {/* --- 3. Questions Section --- */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              
              <div className="flex gap-4 mb-6">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <h3 className="text-lg font-medium text-gray-800 pt-1">{q.text}</h3>
              </div>

              {/* Attractive Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-0 md:pl-12">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelect(q.id, opt.value)}
                      className={`
                        py-3 px-2 rounded-xl border text-sm font-semibold transition-all duration-200
                        ${isSelected 
                          ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-105' 
                          : `bg-white border-gray-200 text-gray-600 ${opt.color}`
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

        {/* --- 4. Submit Button --- */}
        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSubmit}
            className={`
              flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-all transform active:scale-95
              ${Object.keys(answers).length === questions.length 
                ? 'bg-green-600 hover:bg-green-700 shadow-green-200 cursor-pointer' 
                : 'bg-gray-400 cursor-not-allowed'}
            `}
          >
            <CheckCircle size={20} />
            Submit Evaluation
          </button>
        </div>

      </div>
    </div>
  );
};

export default EvaluationForm;