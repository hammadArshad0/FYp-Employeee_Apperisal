import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Loader2, FileText, Calendar, UserCircle } from 'lucide-react';
import DataService from '../../../services/axios';
import db from '../../../db';

const ConfidentialEvaluationsData = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (user.id) fetchEnrolledCourses();
  }, [user.id]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);

      // Backend se enrollments lo
      const res = await DataService.get(`/Confidential/GetStudentEnrollments/${user.id}`);
      const enrollments = res.data;

      // Dexie se is student ki saari evaluated enrollmentIds lo
      const dexieRecords = await db.evaluations
        .where('studentId')
        .equals(String(user.id))
        .toArray();

      const evaluatedEnrollmentIds = new Set(dexieRecords.map(r => r.enrollmentId));

      // IsEvaluated Dexie se check karo — backend se nahi
      const updatedCourses = enrollments.map(course => ({
        ...course,
        IsEvaluated: evaluatedEnrollmentIds.has(course.EnrollmentId)
      }));

      setCourses(updatedCourses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
console.log(user.name)
  const handleSendReport = async () => {
    try {
      setReportLoading(true);

      const dexieData = await db.evaluations
        .where('studentId')
        .equals(String(user.id))
        .toArray();

      if (!dexieData || dexieData.length === 0) {
        alert("no confidential Evalution found. Please complete at least one evaluation before sending the report.");
        return;
      }

      const res = await DataService.post(
        `/Confidential/GenerateAndEmailReport/${user.id}`,
        { evaluations: dexieData }
      );

      alert(res.data.message || "Report sent !");
    } catch (err) {
      console.error("Backend Error:", err.response?.data);
      alert(err.response?.data || "Failed to send report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-red-600" size={50} />
      <p className="mt-4 font-black text-gray-400 uppercase tracking-widest text-xs">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <nav className="bg-white shadow-sm border-b-2 border-red-600 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-100">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Confidential Portal</h1>
            <div className="flex items-center gap-2 text-red-600">
              <Calendar size={12} />
              <span className="text-[10px] font-black uppercase italic">{user.sessionName || 'Academic Session'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-50 px-5 py-2 rounded-2xl border border-gray-100">
            <UserCircle className="text-gray-400" size={36} />
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Logged In</p>
              <p className="text-sm font-black text-gray-900 uppercase italic">{user.name}</p>
              <p className="text-[10px] font-bold text-red-600">ARID ID: {user.id}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">

        {/* Banner */}
        <div className="bg-gray-900 rounded-3xl p-10 mb-10 text-white relative shadow-2xl">
          <FileText size={180} className="absolute -right-10 -bottom-10 text-white opacity-5 rotate-12 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Confidential Evaluation</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Session: <span className="text-red-500">{user.sessionName}</span>
              </p>
            </div>

            <button
              onClick={handleSendReport}
              disabled={reportLoading}
              className={`hidden lg:flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all shadow-xl shrink-0 ${
                reportLoading ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-red-600 text-white hover:bg-white hover:text-black'
              }`}
            >
              {reportLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
              {reportLoading ? "Generating..." : "Submit all confidential Evaluations"} 
            </button>
          </div>
        </div>

        {/* Mobile Report Button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={handleSendReport}
            disabled={reportLoading}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase transition-all ${
              reportLoading ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-black text-white hover:bg-red-600'
            }`}
          >
            {reportLoading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
            {reportLoading ? "Generating..." : "Email Report to Admin"}
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="font-black text-gray-400 uppercase tracking-widest">No Enrollments Found</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.EnrollmentId} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between hover:shadow-xl transition-all group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wider">{course.CourseCode}</span>
                    <div className={`w-3 h-3 rounded-full ${course.IsEvaluated ? 'bg-blue-500' : 'bg-orange-400 animate-pulse'}`}></div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 uppercase leading-tight group-hover:text-red-600 transition-colors">{course.CourseTitle}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-8">Professor: <span className="text-gray-800">{course.TeacherName}</span></p>
                </div>

                <button
                  disabled={course.IsEvaluated}
                  onClick={() => navigate('/student/confidential-evaluation/confidential-form', { state: { course } })}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    course.IsEvaluated
                      ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-red-600 shadow-lg shadow-gray-200 active:scale-95'
                  }`}
                >
                  {course.IsEvaluated ? 'Evaluation Completed' : 'Start Review'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfidentialEvaluationsData;