import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, CheckCircle, ArrowRight, UserCircle, Star, MapPin, ShieldCheck, Clock } from 'lucide-react';
import DataService from '../../../services/axios';

const PeerEvalutionC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [submittedList, setSubmittedList] = useState([]);
  const [isEvaluator, setIsEvaluator] = useState(null);
  const [evaluatorInfo, setEvaluatorInfo] = useState({ designation: "", isPermanent: false });
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // ✅ Rank Hierarchy logic
  const rankLevels = {
    "professor": 4,
    "assistant professor": 3,
    "senior lecturer": 2,
    "lecturer": 1,
    "junior lecturer": 1,
    "teacher": 1
  };

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

      // 1. Check Authorization & Evaluator Type
      const authRes = await DataService.get(`/TeacherDashboard/IsEvaluator/${userId}`);

      if (authRes.data && authRes.data.isEvaluator) {
        setIsEvaluator(true);
        setEvaluatorInfo({
          designation: authRes.data.designation || "",
          isPermanent: authRes.data.isPermanent // Permanent vs Session check
        });

        // 2. Fetch Teachers and History
        const [teachersRes, submittedRes] = await Promise.all([
          DataService.get(`/TeacherDashboard/GetTeachersWithCourses?userId=${userId}`),
          DataService.get(`/TeacherDashboard/GetSubmittedEvaluations/${userId}`)
        ]);

        setTeachers(teachersRes.data || []);
        setSubmittedList(submittedRes.data || []);
      } else {
        setIsEvaluator(false);
      }
    } catch (err) {
      console.error("Dashboard initialization failed:", err);
      setIsEvaluator(false);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyDone = (tId, cCode) => {
    return submittedList.some(s =>
      String(s.TeacherID).toLowerCase().trim() === String(tId).toLowerCase().trim() &&
      String(s.CourseCode).toLowerCase().trim() === String(cCode).toLowerCase().trim()
    );
  };

  const myRank = rankLevels[evaluatorInfo.designation?.toLowerCase().trim()] ?? 0;

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Evaluation Records...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* --- STICKY NAVBAR --- */}
      <nav className="bg-white border-b-2 border-green-700 sticky top-0 z-50 px-6 md:px-12 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-green-700 p-3 rounded-2xl text-white shadow-lg shadow-green-100">
            <Users size={24} />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-gray-800">Peer Evaluation</h1>
            <div className="flex gap-2 mt-1">
              {/* User Designation Badge */}
              <span className="text-[9px] font-black bg-green-50 text-green-700 px-2 py-0.5 rounded uppercase border border-green-100">
                {evaluatorInfo.designation || 'Faculty'}
              </span>

              {/* Evaluator Type Badge (Permanent vs Session) */}
              {evaluatorInfo.isPermanent ? (
                <span className="text-[9px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-yellow-200">
                  <ShieldCheck size={10} /> Permanent Evaluator
                </span>
              ) : (
                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-blue-200">
                  <Clock size={10} /> Session Evaluator
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
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
            <AlertCircle className="text-red-500 mx-auto mb-6" size={40} />
            <h2 className="text-2xl font-black text-gray-800 uppercase italic">Access Denied</h2>
            <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2">
              Unauthorized: You are not assigned as a Peer Evaluator.
            </p>
          </div>
        ) : (
        <div className="grid gap-6">
  {teachers
    .filter(t => (rankLevels[t.Designation?.toLowerCase().trim()] ?? 0) <= myRank)
    .filter(t => String(t.TeacherID).toLowerCase().trim() !== String(userId).toLowerCase().trim())
    .length > 0 ? (

    teachers
      .filter(t => (rankLevels[t.Designation?.toLowerCase().trim()] ?? 0) <= myRank)
      .filter(t => String(t.TeacherID).toLowerCase().trim() !== String(userId).toLowerCase().trim())
      .flatMap((teacher) =>
        (teacher.Courses?.length > 0 ? teacher.Courses : ["N/A"]).map((course) => {
          const done = isAlreadyDone(teacher.TeacherID, course);
          return { teacher, course, done };
        })
      )
      .map(({ teacher, course, done }, idx) => (
        <div
          key={`${teacher.TeacherID}-${course}-${idx}`}
          className={`bg-white border-2 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between transition-all duration-300
            ${done ? 'bg-gray-50 border-gray-100 opacity-80' : 'hover:border-green-400 hover:shadow-xl border-gray-100'}`}
        >
          <div className="flex items-center gap-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black ${done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {done ? <CheckCircle size={28} /> : <span className="text-2xl italic">{idx + 1}</span>}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-black text-2xl text-gray-800 uppercase italic leading-tight">{teacher.TeacherName}</h3>
                <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">ID: {teacher.TeacherID}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-gray-500">
                {/* Designation Badge */}
                <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  {teacher.Designation || "Lecturer"}
                </span>

                <span className="text-gray-300">|</span>

                {/* Department */}
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {teacher.Department || "Academic Faculty"}
                  </span>
                </div>

                <span className="text-gray-300">|</span>

                {/* Course — har course alag */}
                <p className="text-[10px] font-bold uppercase tracking-widest italic text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {course}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-0">
            {done ? (
              <div className="flex items-center justify-center gap-3 bg-white text-green-600 px-8 py-4 rounded-2xl font-black text-xs uppercase border-2 border-green-600 min-w-[180px]">
                <CheckCircle size={18} /> Evaluation Done
              </div>
            ) : (
              <button
                onClick={() => navigate(`/teacher-dashboard/evaluate/${teacher.TeacherID}/${course}`, {
                  state: { peer: { ...teacher, SessionName: user.sessionName } }
                })}
                className="flex items-center justify-center gap-4 bg-green-700 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-lg hover:shadow-green-200 active:scale-95 min-w-[180px]"
              >
                Start Peer Evalution <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      ))
  ) : (
    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No faculty members found for peer assessment.</p>
    </div>
  )}
</div>
        )}
      </main>
    </div>
  );
};

export default PeerEvalutionC;