import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvalution = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [submittedList, setSubmittedList] = useState([]);
  const [isEvaluator, setIsEvaluator] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const userId = localStorage.getItem('userId');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (userId) initializeDashboard();
    else { setLoading(false); setIsEvaluator(false); }
  }, [userId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const authRes = await DataService.get(`/TeacherDashboard/IsEvaluator/${userId}`);
      
      if (authRes.data.isEvaluator) {
        setIsEvaluator(true);
        const [teachersRes, submittedRes] = await Promise.all([
          DataService.get('/TeacherDashboard/GetTeachersWithCourses'),
          DataService.get(`/TeacherDashboard/GetSubmittedEvaluations/${userId}`)
        ]);

        const listWithoutMe = teachersRes.data.filter(t => String(t.TeacherID) !== String(userId));
        setTeachers(listWithoutMe);
        setSubmittedList(submittedRes.data || []);
      } else {
        setIsEvaluator(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setIsEvaluator(false);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyDone = (tId, cCode) => {
    return submittedList.some(s => String(s.TeacherID) === String(tId) && s.CourseCode === cCode);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
      <span className="text-sm text-gray-500 font-medium tracking-wide">Loading portal...</span>
    </div>
  );

  if (isEvaluator === false) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-sm w-full">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Not Authorized</h2>
        <p className="text-gray-500 text-sm mb-6">you are not peer evaluator.</p>
        <button onClick={() => navigate('/teacher-dashboard')} className="w-full py-2.5 bg-gray-900 text-white rounded-md text-sm font-semibold">Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-green-600" size={20} />
            <span className="font-bold text-gray-800 tracking-tight">Peer Evaluation</span>
          </div>
          <div className="text-xs text-gray-500">
            Welcome, <span className="font-semibold text-gray-800">{user.name || 'Professor'}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Faculty Members</h2>
          <p className="text-gray-500 text-sm">Start Evaluation.</p>
        </header>

        {/* Table View (Mobile responsive cards) */}
        <div className="grid gap-4">
          {teachers.map((teacher, idx) => {
            const firstCourse = teacher.Courses[0] || "N/A";
            const done = isAlreadyDone(teacher.TeacherID, firstCourse);

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-blue-300 transition-colors shadow-sm">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-10 h-10 bg-blue-50 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{teacher.TeacherName}</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{firstCourse}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {done ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle size={14} /> Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate('/teacher-dashboard/evaluate', { 
                        state: { 
                          peer: { TeacherID: teacher.TeacherID, TeacherName: teacher.TeacherName, CourseCode: firstCourse }, 
                          evaluatorId: userId 
                        } 
                      })}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      Start Review <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default PeerEvalution;