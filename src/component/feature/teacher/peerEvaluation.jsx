import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, CheckCircle, ArrowRight, UserCircle, Calendar, ShieldCheck } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvalution = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [submittedList, setSubmittedList] = useState([]);
  const [isEvaluator, setIsEvaluator] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Local storage se user data nikalna
  const userId = localStorage.getItem('userId');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (userId) {
      initializeDashboard();
    } else {
      setLoading(false);
      setIsEvaluator(false);
    }
  }, [userId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // 1. Check if user is allowed (IsEvaluator check)
      const authRes = await DataService.get(`/TeacherDashboard/IsEvaluator/${userId}`);
      
      if (authRes.data.isEvaluator) {
        setIsEvaluator(true);

        // 2. Fetch Teachers & History 
        // Note: Backend handles session logic based on userId now
        const [teachersRes, submittedRes] = await Promise.all([
          DataService.get(`/TeacherDashboard/GetTeachersWithCourses/${userId}`),
          DataService.get(`/TeacherDashboard/GetSubmittedEvaluations/${userId}`)
        ]);

        // Filter out the logged-in user from the list
        const filteredTeachers = (teachersRes.data || []).filter(
          t => String(t.TeacherID).toLowerCase() !== String(userId).toLowerCase()
        );

        setTeachers(filteredTeachers);
        setSubmittedList(submittedRes.data || []);
      } else {
        setIsEvaluator(false);
      }
    } catch (err) {
      console.error("Initialization Error:", err);
      setIsEvaluator(false);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyDone = (tId, cCode) => {
    return submittedList.some(s => 
        String(s.TeacherID).toLowerCase() === String(tId).toLowerCase() && 
        s.CourseCode === cCode
    );
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center px-4 animate-pulse">
        Authenticating Faculty Credentials...
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* --- STICKY HEADER --- */}
      <nav className="bg-white border-b-2 border-green-700 sticky top-0 z-50 px-6 md:px-12 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg shadow-green-100">
            <Users size={24}/>
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-gray-800">Peer Evaluation</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-[0.2em]">Quality Assurance Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
               <Calendar size={12} className="text-green-700" />
               <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Active Status</p>
            </div>
            <p className="text-sm font-black text-gray-900 uppercase">
                {user.sessionName || 'Academic Session'}
            </p>
          </div>

          <div className="h-10 w-[2px] bg-gray-100 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
             <UserCircle className="text-gray-400" size={32} />
             <div className="text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase leading-none tracking-tighter">Evaluator ID</p>
                <p className="text-xs font-black text-gray-800 uppercase italic">{userId}</p>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Banner Section */}
        <div className="mb-10 bg-green-700 rounded-[3rem] p-10 text-white flex justify-between items-center overflow-hidden relative shadow-2xl shadow-green-200 border-4 border-white">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                   <ShieldCheck size={20} className="text-green-300" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-200">Official Evaluation</span>
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-1">Faculty Peer Review</h2>
                <p className="text-green-100 font-bold text-sm uppercase tracking-widest opacity-80">
                   Enhancing Academic Excellence through Peer Feedback
                </p>
            </div>
            <Users size={180} className="absolute -right-12 -bottom-12 text-green-600 opacity-20 rotate-12" />
        </div>

        {!isEvaluator ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 shadow-inner">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <AlertCircle className="text-red-500" size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">Access Restricted</h2>
                <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2">
                    Your account is not authorized for Peer Evaluations. Please contact the Department HOD for access.
                </p>
            </div>
        ) : (
            <div className="grid gap-6">
              {teachers.length > 0 ? (
                teachers.map((teacher, idx) => {
                  const firstCourse = teacher.Courses[0] || "N/A";
                  const done = isAlreadyDone(teacher.TeacherID, firstCourse);

                  return (
                    <div key={idx} className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between transition-all hover:border-green-400 hover:shadow-2xl hover:shadow-green-50 group relative overflow-hidden">
                      <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black transition-all duration-500 ${done ? 'bg-green-600 text-white scale-90' : 'bg-gray-100 text-gray-300 group-hover:bg-green-50 group-hover:text-green-600'}`}>
                          {/* <span className="text-[10px] uppercase leading-none mb-1">Rank</span> */}
                          <span className="text-3xl italic">{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight italic">{teacher.TeacherName}</h3>
                             <span className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{teacher.TeacherID}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                              {teacher.Courses.map(c => (
                                  <span key={c} className="text-[9px] bg-white border-2 border-gray-100 text-gray-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-sm group-hover:border-green-100 group-hover:text-green-700 transition-colors">
                                      {c}
                                  </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 md:mt-0 relative z-10">
                        {done ? (
                          <div className="flex items-center gap-3 bg-white text-green-600 px-10 py-5 rounded-2xl font-black text-xs uppercase border-2 border-green-600 shadow-md">
                            <CheckCircle size={20} className="animate-bounce" /> Evaluation Completed
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/teacher-dashboard/evaluate/${teacher.TeacherID}/${firstCourse}`, { 
                                state: { peer: { ...teacher, SessionName: user.sessionName } } 
                            })}
                            className="flex items-center gap-4 bg-green-700 hover:bg-black text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-green-100 group-hover:px-14"
                          >
                            Begin Assessment <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No faculty members found for evaluation.</p>
                </div>
              )}
            </div>
        )}
      </main>
      
      {/* Footer Info */}
      <footer className="text-center py-10">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Confidential Peer Review System v3.0</p>
      </footer>
    </div>
  );
};

export default PeerEvalution;