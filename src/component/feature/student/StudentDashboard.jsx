import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, BookOpen, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (user.id) fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await DataService.get(`/Student/GetStudentEnrollments/${user.id}`);
      setCourses(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <BookOpen className="text-green-600" size={30} />
          <h1 className="text-2xl font-black text-gray-800">Student Portal</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right border-r-2 pr-6 border-gray-200">
            <p className="text-lg font-black text-gray-900 uppercase leading-none">{user.name}</p>
            <p className="text-sm text-green-700 font-bold mt-1">ID: {user.id} | {user.sessionName || 'Fall 2025'}</p>
          </div>
          <button onClick={() => { localStorage.removeItem('user'); navigate('/login'); }} className="text-red-500 hover:scale-110 transition-transform">
            <LogOut size={26} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10">
        <h2 className="text-3xl font-black text-gray-900 mb-8 border-l-8 border-green-600 pl-4">Enrolled Courses</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.EnrollmentId} className="bg-white rounded-2xl shadow-lg border-2 border-black p-8 hover:shadow-2xl transition-all">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black bg-gray-100 px-3 py-1.5 rounded-md text-gray-700 uppercase">{course.CourseCode}</span>
                <span className={`text-xs font-black px-4 py-1.5 rounded-full border-2 ${course.IsEvaluated ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-green-600 border-green-100 bg-green-50'}`}>
                  {course.IsEvaluated ? 'COMPLETED' : 'PENDING'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-4 leading-tight">{course.CourseTitle}</h3>
              <p className="text-base text-gray-500 mb-8 font-semibold">Instructor: <span className="text-gray-900">{course.TeacherName}</span></p>
              <button 
                disabled={course.IsEvaluated}
                onClick={() => navigate('/student/evaluate', { state: { course } })}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${course.IsEvaluated ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95'}`}
              >
                {course.IsEvaluated ? 'Evaluation Submitted' : 'Start Evaluation'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;