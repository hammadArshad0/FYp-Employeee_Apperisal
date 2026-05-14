import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfidential, setIsConfidential] = useState(false); // Dynamic state

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (user.id) {
      fetchDashboardData();
    } else {
      navigate('/login');
    }
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Enrolled Courses Fetch karein
      const resCourses = await DataService.get(`/Student/GetStudentEnrollments/${user.id}`);
      setCourses(resCourses.data);

      // 2. Dynamic Check: Kya ye student Top 3 mein hai?
      const resStatus = await DataService.get(`/Confidential/CheckConfidentialStatus/${user.id}`);
      setIsConfidential(resStatus.data.isConfidential);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <BookOpen className="text-green-600" size={30} />
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Student Portal</h1>
        </div>
        <div className="flex items-center gap-8">
          <p className="text-md font-bold text-gray-800 uppercase tracking-widest">Session:{user.sessionName || 'Spring 2026'}</p>
          <div className="text-right border-r-2 pr-6 border-gray-200">
            <p className="text-lg font-black text-gray-900 uppercase">{user.name || 'Student'}</p>
            <p className="text-sm text-green-700 font-bold mt-1">ID: {user.id}</p>
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:scale-125 transition-all">
            <LogOut size={26} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10">
        {/* --- Dynamic Confidential Portal Button --- */}
        {!loading && isConfidential && (
          <div className="mb-12 bg-gray-900 rounded-3xl p-8 shadow-2xl border-b-8 border-red-500 flex flex-col md:flex-row justify-between items-center animate-bounce-short">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="bg-red-500 p-4 rounded-2xl">
                <ShieldCheck className="text-white" size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic">Confidential Portal</h2>
                <p className="text-white font-semibold italic">You are selected as a Confidential Evaluator based on your Top Academic Performance!</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/student/confidential-evaluation')}
              className="bg-white text-gray-900 px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-3"
            >
              Start Confidential Evaluation <ArrowRight size={20} />
            </button>
          </div>
        )}

        <h2 className="text-3xl font-black text-gray-900 mb-8 border-l-8 border-green-600 pl-4 uppercase">Enrolled Courses</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-green-600" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.EnrollmentId} className="bg-white rounded-2xl shadow-xl border-2 border-black p-8 hover:translate-y-[-5px] transition-all">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black bg-gray-100 px-3 py-1.5 rounded-md">{course.CourseCode}</span>
                  <span className={`text-xs font-black px-4 py-1.5 rounded-full border-2 ${course.IsEvaluated ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-green-600 border-green-200 bg-green-50'}`}>
                    {course.IsEvaluated ? 'COMPLETED' : 'PENDING'}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-4 h-16 line-clamp-2 uppercase">{course.CourseTitle}</h3>
                <p className="text-sm text-gray-500 mb-8 font-bold">Teacher: <span className="text-gray-900">{course.TeacherName}</span></p>
                <button 
                  disabled={course.IsEvaluated}
                  onClick={() => navigate('/student/evaluate', { state: { course } })}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase transition-all ${course.IsEvaluated ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-black'}`}
                >
                  {course.IsEvaluated ? 'Submitted' : 'Start Evaluation'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;