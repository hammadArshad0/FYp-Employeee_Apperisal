import React, { useState, useEffect } from 'react';
import { Loader2, Trophy, Users, Award, MapPin, AlertCircle } from 'lucide-react';
import DataService from '../../../services/axios'; // Aapka axios path

const TopPerformanceDashboard = () => {
  // ── HARDCODED SESSION ID ──
  // Agar login se uthana hai toh localStorage.getItem('sessionId') ya direct '3' likh dein
  const HARDCODED_SESSION_ID = 3; 
  
  // ── States ──
  const [bestTeacher, setBestTeacher] = useState(null);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState('');

  const [teacherCount, setTeacherCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [countError, setCountError] = useState('');

  // PAGE LOAD HOTE HI AUTO CALL (useEffect)
  useEffect(() => {
    // Dono functions ko direct session ID de kar call kar rahay hain
    fetchBestTeacher(HARDCODED_SESSION_ID);
    fetchTeachersCount(HARDCODED_SESSION_ID);
  }, []);

  // 1. Fetch Best Teacher
  const fetchBestTeacher = (sessionId) => {
    setLoadingTeacher(true);
    setTeacherError('');
    setBestTeacher(null);

    DataService.get(`/TopPerformance/GetBestPerformerTeacher?sessionId=${sessionId}`)
      .then(res => {
        if (res.data && res.data.Message) {
          setTeacherError(res.data.Message);
        } else {
          setBestTeacher(res.data);
        }
      })
      .catch(err => {
        console.error(err);
        setTeacherError("Top performer load nahi ho saka.");
      })
      .finally(() => setLoadingTeacher(false));
  };

  // 2. Fetch Total Teachers Count
  const fetchTeachersCount = (sessionId) => {
    setLoadingCount(true);
    setCountError('');
    setTeacherCount(null);

    DataService.get(`/TopPerformance/GetTeachersCount?sessionId=${sessionId}`)
      .then(res => {
        if (res.data) {
          setTeacherCount(res.data.TotalTeachers);
        }
      })
      .catch(err => {
        console.error(err);
        setCountError("Count load nahi ho saka.");
      })
      .finally(() => setLoadingCount(false));
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER (Bina kisi control panel ke) */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic tracking-tighter">
              Performance Dashboard
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Live Faculty Statistics — Session ID: {HARDCODED_SESSION_ID}
            </p>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* TOTAL TEACHERS CARD */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between group relative overflow-hidden min-h-[250px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -z-0 transition-all group-hover:bg-green-50 duration-500" />
            
            <div className="relative z-10">
              <div className="h-14 w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Users size={28} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-1">
                Faculty Strength
              </p>
              <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter">
                Total Active Teachers
              </h3>
            </div>
            
            <div className="relative z-10 mt-6">
              {loadingCount ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Loading...</span>
                </div>
              ) : countError ? (
                <p className="text-xs font-bold text-red-500 uppercase">{countError}</p>
              ) : (
                <>
                  <p className="text-7xl font-black text-slate-800 tracking-tighter leading-none">
                    {teacherCount ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                    Enrolled Faculty Members
                  </p>
                </>
              )}
            </div>
          </div>

          {/* BEST PERFORMER CARD */}
          <div className="md:col-span-2 min-h-[250px] flex">
            {loadingTeacher ? (
              <div className="bg-white border border-slate-100 rounded-[3rem] w-full flex flex-col items-center justify-center shadow-xl space-y-3">
                <Loader2 size={32} className="animate-spin text-green-800" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analyzing Performance...</p>
              </div>
            ) : teacherError ? (
              <div className="bg-red-50 border border-red-100 p-8 rounded-[3rem] w-full flex items-center gap-4 text-red-700 shadow-sm">
                <AlertCircle size={28} className="shrink-0" />
                <p className="font-black text-sm uppercase tracking-wider">{teacherError}</p>
              </div>
            ) : bestTeacher ? (
              <div className="bg-gradient-to-br from-green-900 to-emerald-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between w-full">
                <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-xl">
                      <Trophy size={32} />
                    </div>
                    <div>
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        Top Performer
                      </span>
                      <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mt-1 leading-tight">
                        {bestTeacher.TeacherName}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-white/10 px-6 py-4 rounded-[2rem] border border-white/10 text-center min-w-[130px] backdrop-blur-sm">
                    <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest mb-0.5">SCORE</p>
                    <p className="text-4xl font-black tracking-tight text-amber-400">{bestTeacher.Percentage}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 mt-8 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/5 rounded-xl text-green-300">
                      <Award size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50 font-bold">Department</p>
                      <p className="text-sm font-black uppercase tracking-tight text-slate-100">{bestTeacher.Department || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/5 rounded-xl text-green-300">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50 font-bold">Faculty ID</p>
                      <p className="text-sm font-black uppercase tracking-tight text-slate-100">{bestTeacher.TeacherID}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TopPerformanceDashboard;