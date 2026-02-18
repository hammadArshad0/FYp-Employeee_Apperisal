import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, CheckCircle, ArrowRight, UserCircle, Calendar } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvalution = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [submittedList, setSubmittedList] = useState([]);
  const [isEvaluator, setIsEvaluator] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Local storage se data nikalna (Jo humne Login par save kiya tha)
  const userId = localStorage.getItem('userId');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (userId) initializeDashboard();
    else { setLoading(false); setIsEvaluator(false); }
  }, [userId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      // Check if user is allowed to evaluate
      const authRes = await DataService.get(`/TeacherDashboard/IsEvaluator/${userId}`);
      
      if (authRes.data.isEvaluator) {
        setIsEvaluator(true);
        
        // Agar backend response mein session ID hai toh wo use karein, 
        // warna login wale user object se session ID uthayein
        const sId = authRes.data.sessionID || user.sessionId;

        const [teachersRes, submittedRes] = await Promise.all([
          DataService.get(`/TeacherDashboard/GetTeachersWithCourses/${sId}`),
          DataService.get(`/TeacherDashboard/GetSubmittedEvaluations/${userId}`)
        ]);

        setTeachers(teachersRes.data.filter(t => String(t.TeacherID).toLowerCase() !== String(userId).toLowerCase()));
        setSubmittedList(submittedRes.data || []);
      } else {
        setIsEvaluator(false);
      }
    } catch (err) {
      console.error("Init Error:", err);
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
      <span className="text-xs font-black uppercase tracking-widest text-gray-400 text-center px-4">
        Connecting to {user.sessionName || 'Academic'} Session...
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- HEADER --- */}
      <nav className="bg-white border-b-2 border-green-700 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg">
            <Users size={24}/>
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none">Peer Evaluation</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Faculty Review System</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* --- SESSION INFO FROM LOGIN DATA --- */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
               <Calendar size={12} className="text-green-700" />
               <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Active Session</p>
            </div>
            <p className="text-sm font-black text-gray-900 uppercase">
                {/* Yahan user object wala session display ho raha hai */}
                {user.sessionName || 'N/A'}
            </p>
          </div>

          <div className="h-10 w-[2px] bg-gray-100 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
             <UserCircle className="text-gray-400" size={32} />
             <div className="text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Evaluator</p>
                <p className="text-xs font-black text-gray-800 uppercase italic">{user.name}</p>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {/* Session Banner */}
        <div className="mb-8 bg-green-700 rounded-3xl p-8 text-white flex justify-between items-center overflow-hidden relative shadow-2xl shadow-green-200">
            <div className="relative z-10">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Faculty Evaluation</h2>
                <p className="text-green-100 font-bold text-sm uppercase tracking-widest opacity-80">
                    Reviewing Peer Performance for {user.sessionName}
                </p>
            </div>
            <Users size={120} className="absolute -right-8 -bottom-8 text-green-600 opacity-30" />
        </div>

        {!isEvaluator && !loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                <h2 className="text-xl font-black text-gray-800 uppercase">Access Denied</h2>
                <p className="text-gray-500 font-bold">You are not authorized as an evaluator for this session.</p>
            </div>
        ) : (
            <div className="grid gap-4">
              {teachers.map((teacher, idx) => {
                const firstCourse = teacher.Courses[0] || "N/A";
                const done = isAlreadyDone(teacher.TeacherID, firstCourse);

                return (
                  <div key={idx} className="bg-white border-2 border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between transition-all hover:border-green-200 hover:shadow-xl group">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl rotate-3 group-hover:rotate-0 transition-transform ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">{teacher.TeacherName}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {teacher.Courses.map(c => (
                                <span key={c} className="text-[9px] bg-black text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest">{c}</span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0">
                      {done ? (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-8 py-4 rounded-2xl font-black text-xs uppercase border-2 border-green-100 shadow-sm">
                          <CheckCircle size={18} /> Review Submitted
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/teacher-dashboard/evaluate/${teacher.TeacherID}/${firstCourse}`, { 
                              state: { peer: { ...teacher, SessionName: user.sessionName } } 
                          })}
                          className="flex items-center gap-3 bg-green-700 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-100"
                        >
                          Evaluate Peer <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </main>
    </div>
  );
};

export default PeerEvalution;