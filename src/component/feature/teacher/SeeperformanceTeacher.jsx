import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, Target, Award, Star, Users, UserCheck, ShieldCheck, ShieldAlert, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";

const SeePerformanceTeacher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confidentialData, setConfidentialData] = useState([]);
  const [dexieConfAvg, setDexieConfAvg] = useState(0);

  useEffect(() => {
    const teacherId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('sessionId');

    const fetchPerformance = async () => {
      try {
        const res = await DataService.get(`/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${sessionId}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching performance", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchConfidentialFromDexie = async () => {
      try {
        const records = await db.evaluations
          .where('teacherId')
          .equals(String(teacherId))
          .toArray();

        setConfidentialData(records);

        if (records.length > 0) {
          const totalScore = records.reduce((sum, r) => sum + r.score, 0);
          const avg = totalScore / records.length;
          setDexieConfAvg(avg);
          console.log("Dexie Confidential Avg:", avg, "| Records:", records.length);
        }
      } catch (err) {
        console.error("Dexie fetch error:", err);
      }
    };

    fetchPerformance();
    fetchConfidentialFromDexie();
  }, []);

  // ── FIXED: sirf 'confidential' word wale match honge ─────────────────────
  // Student, Peer, Project, Event, Program — sab backend se aayenge
  // Sirf "Confidential Evaluation" SubKPI → Dexie se
  const isConfidentialName = (name) => {
    const n = (name || '').toLowerCase();
    return n.includes('confidential');
  };

  // ── SubKPI Graph: Confidential → Dexie, baaki sab → Backend ─────────────
  const allSubKPIs = data?.Breakdown.flatMap(kpi =>
    kpi.SubDetails.map(sub => {
      const isConf = isConfidentialName(sub.SubName);
      let percentage;

      if (isConf && dexieConfAvg > 0) {
        percentage = Math.round((dexieConfAvg / 4.0) * 100);
      } else {
        percentage = Math.round((sub.SubAchieved / sub.SubMax) * 100) || 0;
      }

      return {
        fullName: `${kpi.KPIName}: ${sub.SubName}`,
        percentage,
        status: percentage > 0 ? 'Completed' : 'Pending',
        isConf
      };
    })
  ) || [];

  // ── KPI Card: Confidential → Dexie, baaki sab → Backend ─────────────────
  const getKPIPercentage = (kpi) => {
    if (isConfidentialName(kpi.KPIName) && dexieConfAvg > 0) {
      return Math.round((dexieConfAvg / 4.0) * 100);
    }
    return Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100) || 0;
  };

  // ── Overall: Confidential → Dexie inject, baaki sab → Backend ───────────
  const overallPercentage = (() => {
    if (!data?.Breakdown) return data?.OverallPercentage || 0;
    let totalAchieved = 0;
    let totalWeight = 0;
    data.Breakdown.forEach(kpi => {
      totalWeight += kpi.KPIWeight;
      if (isConfidentialName(kpi.KPIName) && dexieConfAvg > 0) {
        totalAchieved += (dexieConfAvg / 4.0) * kpi.KPIWeight;
      } else {
        totalAchieved += kpi.KPIAchieved;
      }
    });
    return totalWeight > 0 ? Math.round((totalAchieved / totalWeight) * 10000) / 100 : 0;
  })();

  // ── Group Dexie records by enrollmentId ──────────────────────────────────
  const groupedConfidential = confidentialData.reduce((acc, record) => {
    const key = record.enrollmentId;
    if (!acc[key]) {
      acc[key] = {
        enrollmentId: record.enrollmentId,
        courseCode: record.courseCode,
        courseTitle: record.courseTitle,
        studentId: record.studentId,
        questions: []
      };
    }
    acc[key].questions.push({
      questionText: record.questionText,
      score: record.score,
      questionId: record.questionId
    });
    return acc;
  }, {});
  const groupedArray = Object.values(groupedConfidential);

  const scoreLabel = (score) => {
    if (score === 1) return { label: 'Poor',      color: 'bg-red-100 text-red-700 border-red-200' };
    if (score === 2) return { label: 'Fair',      color: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (score === 3) return { label: 'Good',      color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (score === 4) return { label: 'Excellent', color: 'bg-green-100 text-green-700 border-green-200' };
    return { label: 'N/A', color: 'bg-gray-100 text-gray-500' };
  };

  const barColors = ['#15803d', '#0369a1', '#b91c1c', '#a21caf', '#be185d', '#c2410c', '#4338ca'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
      <Loader2 className="animate-spin text-green-700 mb-4" size={50} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] text-center">Finalizing Analytics...</p>
    </div>
  );

  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans pb-10">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10">

        {/* HEADER */}
        <div className="bg-green-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 rotate-12 hidden md:block">
            <Target size={200} />
          </div>
          <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">Performance Hub</h2>
            <p className="text-green-300 font-bold text-[10px] md:text-xs mt-2 tracking-widest uppercase italic">
              Session Analysis: {data?.SessionName}
            </p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 text-center min-w-[150px] md:min-w-[200px]">
            <p className="text-[8px] md:text-[10px] font-black uppercase opacity-70 italic mb-1">Overall Efficiency</p>
            <p className="text-4xl md:text-6xl font-black italic text-white">{overallPercentage}%</p>
          </div>
        </div>

        {/* SECTION 1: BAR GRAPH */}
        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-16">
            <div className="p-3 md:p-4 bg-green-700 text-white rounded-2xl md:rounded-3xl shadow-lg">
              <BarChart3 size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black text-slate-800 uppercase italic leading-none">Sub-KPI Metrics</h3>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase mt-1 tracking-widest italic">Consolidated Evaluation Results</p>
            </div>
          </div>
          <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="h-[450px] md:h-[550px] min-w-[700px] md:min-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allSubKPIs} margin={{ top: 40, right: 30, left: -20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="fullName"
                    axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                    tick={{ fill: '#1e293b', fontSize: 10, fontWeight: '900' }}
                    interval={0} angle={-45} textAnchor="end" height={100}
                  />
                  <YAxis domain={[0, 100]} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip
                    cursor={{ fill: '#f0fdf4', radius: 15 }}
                    contentStyle={{ borderRadius: '15px', border: 'none', background: '#14532d', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="percentage" radius={[10, 10, 0, 0]} barSize={window.innerWidth < 768 ? 35 : 60}>
                    {allSubKPIs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'Pending' ? '#e2e8f0' : barColors[index % barColors.length]} />
                    ))}
                    <LabelList
                      dataKey="percentage" position="top" offset={-25}
                      style={{ fill: '#ffffff', fontSize: '12px', fontWeight: '900', fontStyle: 'italic' }}
                      formatter={(val) => val === 0 ? "" : `${val}%`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 2: KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {data?.Breakdown.map((kpi, index) => {
            const kpiPerc = getKPIPercentage(kpi);
            const isConf = isConfidentialName(kpi.KPIName);
            return (
              <div key={index} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-t-8 border-green-700 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Award size={100} />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`h-14 w-14 md:h-16 md:w-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all shadow-lg ${
                    kpi.KPIName.toLowerCase().includes('student') ? 'bg-green-50 text-green-700' :
                    kpi.KPIName.toLowerCase().includes('peer') ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {kpi.KPIName.toLowerCase().includes('student') ? <Users size={28} /> :
                     kpi.KPIName.toLowerCase().includes('peer') ? <UserCheck size={28} /> : <Star size={28} />}
                  </div>
                  <div className="text-right text-slate-400">
                    <p className="text-[8px] md:text-[10px] font-black uppercase italic leading-none">Weight</p>
                    <p className="text-lg md:text-xl font-black text-slate-800">{kpi.KPIWeight}</p>
                  </div>
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{kpi.KPIName}</h4>
                <div className="mt-4 md:mt-6 flex items-baseline gap-2">
                  <span className="text-3xl md:text-5xl font-black italic text-green-700">{kpiPerc}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                    {isConf && dexieConfAvg > 0 ? `Local Avg: ${dexieConfAvg.toFixed(1)}/4` : 'Average'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full mt-5 md:mt-6 overflow-hidden">
                  <div className="h-full bg-green-700 transition-all duration-1000" style={{ width: `${kpiPerc}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 3: CONFIDENTIAL DETAIL (DEXIE) */}
        {/* <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 md:gap-4 mb-8">
            <div className="p-3 md:p-4 bg-purple-700 text-white rounded-2xl md:rounded-3xl shadow-lg">
              <ShieldAlert size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black text-slate-800 uppercase italic leading-none">Confidential Reviews</h3>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase mt-1 tracking-widest italic">
                Student Submitted · Overall Local Avg: {dexieConfAvg > 0 ? `${dexieConfAvg.toFixed(2)}/4` : 'N/A'}
              </p>
            </div>
          </div>

          {groupedArray.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
              <ShieldCheck className="mx-auto text-slate-300 mb-4" size={60} />
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No Confidential Evaluations Yet</p>
              <p className="text-slate-300 text-xs mt-2 font-bold uppercase">Data will appear once students submit reviews</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedArray.map((group, gIdx) => {
                const avgScore = group.questions.length > 0
                  ? (group.questions.reduce((sum, q) => sum + q.score, 0) / group.questions.length).toFixed(1)
                  : 0;
                return (
                  <div key={gIdx} className="border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all">
                    <div className="bg-slate-900 px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-600 p-2 rounded-xl">
                          <BookOpen className="text-white" size={18} />
                        </div>
                        <div>
                          <span className="text-purple-400 font-black text-[10px] uppercase tracking-widest">{group.courseCode}</span>
                          <p className="text-white font-black text-sm uppercase italic tracking-tight leading-none mt-0.5">{group.courseTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Student ID</p>
                          <p className="text-xs font-black text-white">{group.studentId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Avg Score</p>
                          <p className="text-2xl font-black text-purple-400 italic">{avgScore}<span className="text-xs text-slate-400">/4</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {group.questions.map((q, qIdx) => {
                        const { label, color } = scoreLabel(q.score);
                        return (
                          <div key={qIdx} className="px-6 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <p className="text-sm font-bold text-slate-700 uppercase leading-snug">{q.questionText || `Question ${q.questionId}`}</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest ${color}`}>
                              {label} ({q.score}/4)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div> */}

        {/* FOOTER */}
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-12 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400 text-center md:text-left">
            <ShieldCheck size={20} className="text-green-700 shrink-0" />
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest italic leading-relaxed">
              All performance data is secured and verified by the system.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeePerformanceTeacher;