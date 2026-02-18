import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Loader2, FileText, Send } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluationsData = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false); // Report loading state
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (user.id) fetchEnrolledCourses();
  }, [user.id]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await DataService.get(`/Confidential/GetStudentEnrollments/${user.id}`);
      setCourses(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

 const handleSendReport = async () => {
  try {
    setReportLoading(true);
    const res = await DataService.post(`/Confidential/GenerateAndEmailReport/${user.id}`);
    alert(res.data.message);
  } catch (err) {
    // Console check karein ke backend se kya message aa raha hai
    console.error("Backend Error:", err.response?.data);
    alert(err.response?.data || "Failed to send report. Database or Email error.");
  } finally {
    setReportLoading(false);
  }
};

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-green-600" size={50} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <BookOpen className="text-green-600" size={30} />
          <h1 className="text-2xl font-black text-gray-800 uppercase">Confidential Portal</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right border-r-2 pr-6 border-gray-200">
            <p className="text-lg font-black text-gray-900 uppercase leading-none">{user.name}</p>
            <p className="text-sm text-green-700 font-bold mt-1">ID: {user.id}</p>
          </div>
          <button onClick={() => { localStorage.removeItem('user'); navigate('/login'); }} className="text-red-500 hover:scale-110">
            <LogOut size={26} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 border-l-8 border-red-600 pl-4 uppercase">
            Management Evaluation
          </h2>
          
          {/* NAYA BUTTON */}
          <button 
            onClick={handleSendReport}
            disabled={reportLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase transition-all shadow-lg ${
              reportLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-red-700'
            }`}
          >
            {reportLoading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
            {reportLoading ? "Processing PDF..." : "Email Report to Admin"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.EnrollmentId} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 hover:border-red-500 transition-all">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black bg-gray-100 px-3 py-1.5 rounded-md text-gray-700 uppercase">{course.CourseCode}</span>
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border-2 ${course.IsEvaluated ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-orange-600 border-orange-100 bg-orange-50'}`}>
                  {course.IsEvaluated ? 'COMPLETED' : 'PENDING'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-4">{course.CourseTitle}</h3>
              <p className="text-base text-gray-500 mb-8 font-semibold uppercase">Instructor: <span className="text-gray-900">{course.TeacherName}</span></p>
              <button 
                disabled={course.IsEvaluated}
                onClick={() => navigate('/student/confidential-evaluation/confidential-form', { state: { course } })}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase transition-all ${course.IsEvaluated ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-black active:scale-95'}`}
              >
                {course.IsEvaluated ? 'Submitted' : 'Start Evaluation'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfidentialEvaluationsData;