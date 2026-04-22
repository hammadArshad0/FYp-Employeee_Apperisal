import React, { useState, useEffect, useCallback } from 'react';
import { Users, BarChart3, Loader2, Search, GraduationCap, ShieldCheck, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";
import { useNavigate } from "react-router-dom";

function AcademicPerformance() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState(['All']);
  const [teachersData, setTeachersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dexieScores, setDexieScores] = useState({});
  const [filters, setFilters] = useState({
    session: '',
    dept: 'All',
    course: 'All'
  });

  const navigate = useNavigate();

  // 1. Initial Load: Sessions and Departments
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [resS, resD] = await Promise.all([
          DataService.get('/AcademicPerformance/GetSessions'),
          DataService.get('/AcademicPerformance/GetDepartments')
        ]);
        
        const sessionsData = resS.data || [];
        setSessions(sessionsData);
        setDepartments(['All', ...(resD.data || [])]);

        if (sessionsData.length > 0) {
          // Latest Session is at index 0 because of OrderByDescending in backend
          const latestId = sessionsData[0].id;
          setFilters(prev => ({ ...prev, session: latestId }));
          loadCourses(latestId);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      }
    };
    fetchInit();
  }, []);

  // 2. Load Courses when session changes
  const loadCourses = async (sessionId) => {
    if (!sessionId) return;
    try {
      setCourses([]); // Reset courses while loading
      const res = await DataService.get(`/AcademicPerformance/GetCoursesBySession/${sessionId}`);
      setCourses(res.data || []);
    } catch (err) {
      console.error("Course Loading Error:", err);
    }
  };

  // 3. Main Data Fetch & Merge Logic
  const fetchPerformance = useCallback(async (currentFilters) => {
    if (!currentFilters.session) return;
    setLoading(true);
    try {
      const response = await DataService.get('/AcademicPerformance/GetTeachersPerformanceList', {
        params: { 
          sessionId: currentFilters.session, 
          department: currentFilters.dept === 'All' ? null : currentFilters.dept, 
          courseCode: currentFilters.course === 'All' ? null : currentFilters.course 
        }
      });

      const backendData = response.data || [];
      
      // Dexie (Local) Data fetch and filter by Session
      const allLocalEvals = await db.evaluations.toArray();
      const dexieMap = {};

      backendData.forEach(teacher => {
        const tName = teacher.Name ? teacher.Name.trim().toLowerCase() : "";
        
        // Match by Teacher Name AND Selected Session ID
        const matched = allLocalEvals.filter(e => 
          e.teacherName && e.teacherName.trim().toLowerCase() === tName &&
          String(e.sessionId) === String(currentFilters.session)
        );

        if (matched.length > 0) {
          const avg4 = matched.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / matched.length;
          dexieMap[teacher.TeacherID || teacher.Name] = (avg4 / 4) * 10; 
        } else {
          dexieMap[teacher.TeacherID || teacher.Name] = 0; // Clear score if no data for this session
        }
      });

      setDexieScores(dexieMap);
      setTeachersData(backendData);
    } catch (err) {
      console.error("Performance Fetch Error:", err);
      setTeachersData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when filters change
  useEffect(() => {
    if (filters.session) {
      fetchPerformance(filters);
    }
  }, [filters, fetchPerformance]);

  // Handle Session Change specifically
  const handleSessionChange = (sessionId) => {
    setFilters(prev => ({
      ...prev,
      session: sessionId,
      course: 'All' // Reset course when session changes
    }));
    loadCourses(sessionId);
  };

  // Scoring Logic (30 points total: Std 10, Peer 10, Dexie 10)
  const calculateTotal = (t) => {
    const sScore = Number(t.StudentAverage) || 0;
    const pScore = Number(t.PeerAverage) || 0;
    const dScore = dexieScores[t.TeacherID || t.Name] || 0;
    const total = sScore + pScore + dScore;
    return Math.round((total / 30) * 100);
  };

  const getGraphData = () => {
    return teachersData.map(t => ({
      name: t.Name.split(' ').slice(0, 2).join(' '),
      score: calculateTotal(t)
    })).sort((a, b) => b.score - a.score);
  };

  const getBarColor = (val) => {
    if (val >= 80) return '#16a34a';
    if (val >= 60) return '#f97316';
    if (val <= 30) return '#dc2626';
    return '#3b82f6';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {/* <TrendingUp className="text-blue-600" size={32} /> */}
            Academic Performance
          </h1>
          <p className="text-gray-500 font-medium">Evaluation based on Students, Peers, and Confidential reports.</p>
        </div>
        <button
          className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
          onClick={() => navigate("/director-dashboard/filter-performance/comparison")}
        >
          <BarChart3 size={18} /> Open Comparison
        </button>
      </div>

      {/* Modern Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Active Session</label>
          <select 
            value={filters.session} 
            onChange={(e) => handleSessionChange(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Department</label>
          <select 
            value={filters.dept} 
            onChange={(e) => setFilters({...filters, dept: e.target.value})}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Course</label>
          <select 
            value={filters.course} 
            onChange={(e) => setFilters({...filters, course: e.target.value})}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          >
            <option value="All">All Courses</option>
            {courses.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-gray-500 font-bold tracking-widest">SYNCING ANALYTICS...</p>
        </div>
      ) : (
        <>
          {/* Graph Section */}
          {teachersData.length > 0 && (
            <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-slate-900 text-white rounded-3xl">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Performance Ranking</h3>
                  {/* <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregated Evaluation (30 Point Scale)</p> */}
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGraphData()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const v = payload[0].value;
                          return (
                            <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100">
                              <p className="text-3xl font-black text-slate-800">{v}%</p>
                              <p className="text-[10px] font-black uppercase text-blue-500">Total Performance</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={40}>
                      {getGraphData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                      ))}
                      <LabelList dataKey="score" position="top" formatter={(v) => `${v}%`} style={{ fontWeight: '900', fontSize: '11px' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teachersData.length === 0 ? (
              <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest">No teachers found for this selection</p>
              </div>
            ) : (
              teachersData.map((t, idx) => {
                const totalPerc = calculateTotal(t);
                const dexieVal = dexieScores[t.TeacherID || t.Name] || 0;
                const hasDexie = dexieScores[t.TeacherID || t.Name] !== undefined && dexieScores[t.TeacherID || t.Name] > 0;

                return (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5" style={{backgroundColor: getBarColor(totalPerc)}}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-4 rounded-3xl text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Users size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-800">{t.Name}</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <GraduationCap size={12} /> {t.CourseCode || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-black text-gray-300 uppercase leading-none mb-1">Total</span>
                        <span className={`text-2xl font-black italic ${totalPerc >= 60 ? 'text-slate-800' : 'text-red-500'}`}>{totalPerc}%</span>
                      </div>
                    </div>

                    <div className="space-y-5 mb-8">
                      <MetricBar label="Student Evaluation" value={(Number(t.StudentAverage) / 10) * 100} />
                      <MetricBar label="Peer Evaluation" value={(Number(t.PeerAverage) / 10) * 100} />
                      <MetricBar label="Confidential Evaluation" value={(dexieVal / 10) * 100}  />
                      {/* isDexie={hasDexie} */}
                    </div>

                    <button 
                      onClick={() => navigate(`/director-dashboard/teacher-performance/${t.TeacherID || t.Name}`)}
                      className="w-full bg-green-500 group-hover:bg-green-900 group-hover:text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all"
                    >
                      See Question performance <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricBar({ label, value, isDexie = false }) {
  const safeVal = Math.min(100, Math.max(0, Math.round(value || 0)));
  const getColor = (v) => {
    if (v >= 80) return 'bg-green-600';
    if (v >= 60) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter text-gray-400 px-1">
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {isDexie && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[7px] flex items-center gap-0.5"><ShieldCheck size={8}/> Session Sync</span>}
        </div>
        <span className="text-gray-700">{safeVal}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getColor(safeVal)}`}
          style={{ width: `${safeVal}%` }}
        />
      </div>
    </div>
  );
}

export default AcademicPerformance;