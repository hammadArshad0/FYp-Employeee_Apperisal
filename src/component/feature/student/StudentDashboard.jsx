import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, BookOpen, Calendar, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local storage se user data safely nikalna
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (user.id) {
      fetchEnrolledCourses();
    }
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await DataService.get(`/StudentEvaluation/GetCourses/${user.id}`);
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEvaluateClick = (course) => {
    navigate('/student/evaluate', { state: { course } });
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      <p className="font-bold text-gray-500 uppercase tracking-widest">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* --- Navbar Update --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none">Student Portal</h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold tracking-wider">BIIT Rawalpindi</p>
          </div>
        </div>

        {/* --- Header User Info Section --- */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-right border-r pr-4 border-gray-200">
              <p className="text-sm font-black text-gray-900 uppercase leading-none mb-1">
                {user.name || 'Student Name'}
              </p>
              <p className="text-[11px] text-green-600 font-bold">
                ID: {user.id}
              </p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                <Calendar size={12} /> Session
              </div>
              <p className="text-xs font-bold text-gray-700">Fall 2025</p> {/* Aap yahan dynamic session bhi bhej sakte hain */}
            </div>
            <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center text-white ml-2">
              <User size={20} strokeWidth={2.5} />
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-red-100"
          >
            <LogOut size={18} /> <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Teacher Evaluations</h2>
          <p className="text-gray-500 mt-1 font-medium italic">Welcome back! Please complete your pending assessments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.EnrollmentId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
              <div className={`h-2 w-full ${course.IsEvaluated ? 'bg-blue-500' : 'bg-green-600'}`}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded border border-gray-200 uppercase tracking-widest">
                    {course.CourseCode}
                  </span>
                  {course.IsEvaluated ? (
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 tracking-tighter">Completed</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 tracking-tighter">Pending</span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">{course.CourseTitle}</h3>
                <p className="text-sm text-gray-400 font-medium mb-6">Instructor: <span className="text-gray-700 font-bold">{course.TeacherName}</span></p>

                <button 
                  disabled={course.IsEvaluated}
                  onClick={() => handleEvaluateClick(course)}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    course.IsEvaluated 
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-100'
                  }`}
                >
                  {course.IsEvaluated ? 'Evaluation Submitted' : 'Start Assessment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;