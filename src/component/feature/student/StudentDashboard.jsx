// src/pages/StudentDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, BookOpen, Clock } from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  // Get user from local storage
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Mock Data for Courses
  const courses = [
    { id: 1, code: 'CS-301', name: 'Database Systems', instructor: 'Mr. Ali Khan', status: 'Open', color: 'bg-green-600' },
    { id: 2, code: 'CS-302', name: 'Software Engineering', instructor: 'Dr. Fatima Noor', status: 'Open', color: 'bg-blue-600' },
    { id: 3, code: 'CS-303', name: 'Operating Systems', instructor: 'Mr. Ahmed', status: 'Pending', color: 'bg-orange-500' },
    { id: 4, code: 'MG-101', name: 'Principles of Management', instructor: 'Ms. Sarah', status: 'Open', color: 'bg-purple-600' },
    { id: 5, code: 'CS-405', name: 'Web Development', instructor: 'Mr. Bilal', status: 'Pending', color: 'bg-teal-600' },
  ];

  const handleEvaluateClick = (course) => {
    navigate('/student/evaluate', { state: { course } });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- Top Navbar --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
            <p className="text-xs text-gray-500">Barani Institute of Information Technology</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-bold text-gray-800">{user?.name || 'Student'}</p>
              {/* REMOVED DUMMY ARID NUMBER AS REQUESTED */}
              <p className="text-xs text-green-600 font-medium">Student</p>
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User size={20} />
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <div className="max-w-7xl mx-auto p-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Teacher Evaluations</h2>
          <p className="text-gray-600 mt-2">Select a course from the list below to proceed with the teacher evaluation for Fall 2025.</p>
        </div>

        {/* Status Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <p className="text-green-800 font-medium text-sm">Evaluation Period is currently <strong>Active</strong>. Please complete before 30th Dec.</p>
        </div>

        {/* --- GRID LAYOUT FOR WEBSITE VIEW (3 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
              
              {/* Course Header Color */}
              <div className={`${course.color} h-3 w-full`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">
                    {course.code}
                  </span>
                  {course.status === 'Open' ? (
                     <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-1 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Open
                     </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                       <Clock size={10} /> Pending
                     </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-green-700 transition-colors">{course.name}</h3>
                <p className="text-sm text-gray-500 mb-6">Instructor: <span className="text-gray-800 font-medium">{course.instructor}</span></p>

                {course.status === 'Open' ? (
                  <button 
                    onClick={() => handleEvaluateClick(course)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-green-200 shadow-lg transform active:scale-95 transition-all"
                  >
                    Start Evaluation
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed border border-gray-200"
                  >
                    Not Available Yet
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;