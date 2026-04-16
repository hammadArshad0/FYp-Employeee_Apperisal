import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Loader2, Search, GraduationCap, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";
import { useNavigate } from "react-router-dom";

function FilterPerformance() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState(['All']);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dexieScores, setDexieScores] = useState({});
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

    const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sessionRes, deptRes] = await Promise.all([
          DataService.get('/DirectorFilter/GetSessions'),
          DataService.get('/DirectorFilter/GetDepartments')
        ]);
        setSessions(sessionRes.data);
        if (sessionRes.data.length > 0) setSelectedSession(sessionRes.data[0].id);
        setDepartments(['All', ...deptRes.data]);
      } catch (err) {
        console.error("Error fetching initial lists", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      const fetchCourses = async () => {
        try {
          const res = await DataService.get(`/DirectorFilter/GetCoursesBySession/${selectedSession}`);
          setCourses(res.data);
        } catch (err) {
          console.error("Error fetching courses", err);
        }
      };
      fetchCourses();
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) loadPerformanceData();
  }, [selectedSession, selectedDept, selectedCourse]);

  // ✅ Renamed function to avoid React mapping conflict
  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(`/DirectorFilter/GetFilteredPerformance`, {
        params: { sessionId: selectedSession, department: selectedDept, courseCode: selectedCourse }
      });
      const backendData = res.data;

      const dexieMap = {};
      for (const teacher of backendData) {
        const records = await db.evaluations
          .where('teacherId').equals(String(teacher.TeacherID))
          .and(item => String(item.sessionId) === String(selectedSession))
          .toArray();
        if (records.length > 0) {
          const avg = records.reduce((sum, r) => sum + r.score, 0) / records.length;
          dexieMap[teacher.TeacherID] = avg; // 0-4 scale
        }
      }
      setDexieScores(dexieMap);
      setPerformanceData(backendData);
    } catch (err) {
      console.error("Error fetching performance", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Synchronous function for calculating overall score dynamically
  const calculateOverall = (teacher) => {
    let totalAchieved = 0;
    let totalWeight = 0;

    (teacher.KPIWeights || []).forEach(kpi => {
      let multiplier = kpi.Score;
      let maxScale = kpi.MaxScale;

      if ((kpi.SubName || '').toLowerCase().includes('confidential')) {
        const dexieAvg = dexieScores[teacher.TeacherID];
        if (dexieAvg !== undefined) {
          multiplier = dexieAvg;
        }
      }

      totalAchieved += (multiplier / maxScale) * kpi.Weight;
      totalWeight += kpi.Weight;
    });

    return totalWeight > 0 ? Math.min(100, Math.round((totalAchieved / totalWeight) * 100)) : 0;
  };

  const getConfPerc = (teacher) => {
    const dexieAvg = dexieScores[teacher.TeacherID];
    const kpiWeights = teacher.KPIWeights || [];

    if (dexieAvg !== undefined) {
      return Math.min(100, Math.round((dexieAvg / 4.0) * 100));
    }

    const confKpi = kpiWeights.find(k => (k.SubName || '').toLowerCase().includes('confidential'));
    if (confKpi) {
      return Math.min(100, Math.round(((confKpi.Score || 0) / 4.0) * 100));
    }
    return 0;
  };

  const getBarColor = (value) => {
    if (value >= 80) return '#16a34a';
    if (value >= 60) return '#f97316';
    if (value <= 30) return '#dc2626';
    return '#3b82f6';
  };

  const getGraphData = () => {
    return [...performanceData]
      .map(d => ({
        name: d.TeacherName.split(' ').slice(0, 2).join(' '),
        performance: calculateOverall(d), // ✅ Using sync function here
      }))
      .sort((a, b) => b.performance - a.performance);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-green-600" size={32} />
            Director See Performance
          </h1>
          <p className="text-gray-500 font-medium">Monitoring Teacher Performance with Kpi score.</p>
        </div>
       <button
      className="border border-black-2 text-black-2 px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors"
     onClick={() => navigate("/director-dashboard/filter-performance/comparison")}
    >
      Open Comparison
    </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Active Session</label>
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none">
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Faculty/Dept</label>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none">
            {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Course Catalog</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none">
            <option value="All">All Courses</option>
            {courses.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
          <p className="text-gray-500 font-bold tracking-widest">CALCULATING WEIGHTED SCORES...</p>
        </div>
      ) : (
        <>
          {/* Graph */}
          {performanceData.length > 0 && (
            <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                    <BarChart3 size={26} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
                      Top Performance Overview
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Sorted by Aggregate Weighted Score (Including Local Data)
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase">80%+ Excellent</div>
                  <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase">60%+ Good</div>
                  <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase">31%+ Average</div>
                  <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase">≤30% Critical</div>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGraphData()} margin={{ top: 25, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} dy={12} angle={-20} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: '900', fill: '#94a3b8' }}
                      axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} unit="%" />
                    <Tooltip cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          let status = val >= 80 ? "Excellent" : val >= 60 ? "Good" : val > 30 ? "Average" : "Critical";
                          let colorClass = val >= 80 ? "text-green-600" : val >= 60 ? "text-orange-500" : val > 30 ? "text-blue-600" : "text-red-600";
                          return (
                            <div className="bg-white p-5 shadow-2xl rounded-[2rem] border border-slate-100 min-w-[160px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.name}</p>
                              <p className={`text-3xl font-black ${colorClass}`}>{val}%</p>
                              <p className={`text-[10px] font-bold uppercase mt-1 ${colorClass}`}>{status}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="performance" radius={[12, 12, 4, 4]} barSize={48}>
                      {getGraphData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.performance)} />
                      ))}
                      <LabelList dataKey="performance" position="top" formatter={(v) => `${v}%`}
                        style={{ fontWeight: '900', fontSize: '12px', fill: '#334155' }} dy={-8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {performanceData.length === 0 ? (
              <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                <Search className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-xl font-bold text-gray-400">No records found for current selection.</p>
              </div>
            ) : (
              performanceData.map((data, index) => {
                const hasDexie = dexieScores[data.TeacherID] !== undefined;
                const overallPerc = calculateOverall(data); // ✅ Using sync function here
                const confPerc = getConfPerc(data);

                // Student % from backend
                const studentPerc = Math.min(100, Math.round(data.StudentPercentage || 0));
                // Peer % from backend
                const peerPerc = Math.min(100, Math.round(data.PeerPercentage || 0));
                // KPI % — non-confidential SubKPIs ka average
                const kpiWeights = data.KPIWeights || [];
                const nonConfKpis = kpiWeights.filter(k => !(k.SubName || '').toLowerCase().includes('confidential')
                  && !(k.SubName || '').toLowerCase().includes('student')
                  && !(k.SubName || '').toLowerCase().includes('peer'));
                let kpiPerc = 0;
                if (nonConfKpis.length > 0) {
                  const kpiEarned = nonConfKpis.reduce((sum, k) => sum + ((k.Score || 0) / k.MaxScale) * k.Weight, 0); // ✅ Fixed MaxScale calculation
                  const kpiMax   = nonConfKpis.reduce((sum, k) => sum + k.Weight, 0);
                  kpiPerc = kpiMax > 0 ? Math.min(100, Math.round((kpiEarned / kpiMax) * 100)) : 0;
                }

                return (
                  <div key={index} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">

                    {/* Score Badge */}
                    <div className={`absolute top-6 right-6 px-4 py-2 rounded-full border text-sm font-black ${
                      overallPerc >= 80 ? 'text-green-700 border-green-200 bg-green-50' :
                      overallPerc >= 60 ? 'text-orange-700 border-orange-200 bg-orange-50' :
                      overallPerc <= 30 ? 'text-red-700 border-red-200 bg-red-50' :
                      'text-blue-700 border-blue-200 bg-blue-50'
                    }`}>
                      {overallPerc}%
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="bg-gray-100 p-4 rounded-3xl text-gray-500 group-hover:bg-green-600 group-hover:text-white transition-all">
                        <Users size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-800">{data.TeacherName}</h3>
                        <div className="flex items-center gap-2 text-gray-400">
                          <GraduationCap size={14} />
                          <span className="text-xs font-bold uppercase tracking-widest">{data.Department}</span>
                        </div>
                        {hasDexie && (
                          <div className="mt-2 flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1 rounded-full w-fit">
                            <ShieldCheck size={12} className="text-green-600" />
                            <span className="text-[9px] font-black text-green-700 uppercase tracking-wider">Local Data Applied</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Course Code</p>
                        <p className="font-bold text-gray-700">{data.CourseCode}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Final Weighted</p>
                        <p className={`font-black ${
                          overallPerc >= 80 ? 'text-green-700' :
                          overallPerc >= 60 ? 'text-orange-700' :
                          overallPerc <= 30 ? 'text-red-700' : 'text-blue-700'
                        }`}>{overallPerc}%</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <MetricBar label="Student Evaluation"     value={studentPerc} />
                      <MetricBar label="Peer Review"            value={peerPerc} />
                      <MetricBar label="Confidential Eval"      value={confPerc} isDexie={hasDexie} />
                      <MetricBar label="KPI Compliance"         value={kpiPerc} />
                    </div>
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
    if (v <= 30) return 'bg-red-600';
    return 'bg-blue-500';
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {isDexie && (
            <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[8px] font-black">
              <ShieldCheck size={8} /> Local
            </span>
          )}
        </div>
        <span className="text-gray-700">{safeVal}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${getColor(safeVal)}`}
          style={{ width: `${safeVal}%` }}>
        </div>
      </div>
    </div>
  );
}

export default FilterPerformance;