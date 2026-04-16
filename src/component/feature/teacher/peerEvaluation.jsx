import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, CheckCircle, ArrowRight, UserCircle, Calendar, ShieldCheck, Star, Lock } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvalution = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [submittedList, setSubmittedList] = useState([]);
  const [isEvaluator, setIsEvaluator] = useState(null);
  const [evaluatorInfo, setEvaluatorInfo] = useState({ designation: "", isPermanent: false });
  const [loading, setLoading] = useState(true);
  
  const userId = localStorage.getItem('userId');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // ✅ Rank Hierarchy Mapping
  const rankLevels = {
    "professor": 3,
    "assistant professor": 2,
    "senior lecturer": 1,
    "junior lecturer": 0,
    "lecturer": 0
  };

  useEffect(() => {
    if (userId) initializeDashboard();
  }, [userId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // 1. Get Evaluator Status & Profile Info
      const authRes = await DataService.get(`/TeacherDashboard/IsEvaluator/${userId}`);
      
      if (authRes.data.isEvaluator) {
        setIsEvaluator(true);
        setEvaluatorInfo({
          designation: authRes.data.designation || "",
          isPermanent: authRes.data.isPermanent
        });

        // 2. Fetch Teachers list and History
        const [teachersRes, submittedRes] = await Promise.all([
          DataService.get(`/TeacherDashboard/GetTeachersWithCourses/${userId}`),
          DataService.get(`/TeacherDashboard/GetSubmittedEvaluations/${userId}`)
        ]);

        setTeachers(teachersRes.data || []);
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

  // ✅ Check if logged-in user can evaluate target teacher
  const canEvaluate = (targetDesignation) => {
    const myRank = rankLevels[evaluatorInfo.designation?.toLowerCase()] ?? -1;
    const targetRank = rankLevels[targetDesignation?.toLowerCase()] ?? 0;
    
    // Rule: Equal or Higher rank can evaluate. Junior cannot evaluate Senior.
    return myRank >= targetRank;
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
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Hierarchy Data...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* --- STICKY HEADER --- */}
      <nav className="bg-white border-b-2 border-green-700 sticky top-0 z-50 px-6 md:px-12 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg shadow-green-100">
            <Users size={24}/>
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-gray-800">Peer Evaluation</h1>
            <div className="flex gap-2 mt-1">
                <span className="text-[9px] font-black bg-green-50 text-green-700 px-2 py-0.5 rounded uppercase tracking-tighter">
                   {evaluatorInfo.designation || 'Faculty'}
                </span>
                {evaluatorInfo.isPermanent && (
                    <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                       <Star size={8} fill="currentColor"/> Permanent
                    </span>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Active Session</p>
            <p className="text-sm font-black text-gray-900 uppercase">{user.sessionName || 'Spring 2026'}</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
             <UserCircle className="text-gray-400" size={32} />
             <div className="text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Evaluator ID</p>
                <p className="text-xs font-black text-gray-800 italic">{userId}</p>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {!isEvaluator ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 shadow-inner">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <AlertCircle className="text-red-500" size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 uppercase italic">Access Restricted</h2>
                <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2">
                    Your account is not authorized. Please contact the Department HOD.
                </p>
            </div>
        ) : (
            <div className="grid gap-6">
              {teachers.length > 0 ? (
                teachers.map((teacher, idx) => {
                  const firstCourse = teacher.Courses[0] || "N/A";
                  const done = isAlreadyDone(teacher.TeacherID, firstCourse);
                  const allowed = canEvaluate(teacher.Designation);
                  
                  // Filter self-evaluation
                  if (String(teacher.TeacherID).toLowerCase() === String(userId).toLowerCase()) return null;

                  return (
                    <div key={idx} className={`bg-white border-2 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between transition-all group relative overflow-hidden 
                        ${!allowed ? 'opacity-60 bg-gray-50 border-gray-100 cursor-not-allowed' : 'hover:border-green-400 hover:shadow-2xl border-gray-100'}`}>
                      
                      <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-black transition-all ${done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                          <span className="text-3xl italic">{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h3 className="font-black text-2xl text-gray-800 uppercase italic">{teacher.TeacherName}</h3>
                             <span className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1 rounded-full uppercase">{teacher.TeacherID}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-black uppercase ${allowed ? 'text-green-600' : 'text-red-500 flex items-center gap-1'}`}>
                                {teacher.Designation} {!allowed && <Lock size={10}/>}
                             </span>
                             <span className="text-gray-300">|</span>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{firstCourse}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 md:mt-0">
                        {done ? (
                          <div className="flex items-center gap-3 bg-green-50 text-green-700 px-8 py-4 rounded-2xl font-black text-xs uppercase border border-green-200">
                            <CheckCircle size={18} /> Completed
                          </div>
                        ) : !allowed ? (
                          <div className="bg-red-50 text-red-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-red-100 italic">
                             Senior Evaluation Restricted
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/teacher-dashboard/evaluate/${teacher.TeacherID}/${firstCourse}`, { 
                                state: { peer: { ...teacher, SessionName: user.sessionName } } 
                            })}
                            className="flex items-center gap-4 bg-green-700 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-lg shadow-green-100"
                          >
                            Begin Assessment <ArrowRight size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No faculty members assigned to your session.</p>
                </div>
              )}
            </div>
        )}
      </main>
    </div>
  );
};

export default PeerEvalution;