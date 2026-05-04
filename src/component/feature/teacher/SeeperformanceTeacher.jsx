import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, ShieldCheck, Award, Target, TrendingUp, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";

const SeePerformanceTeacher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  
  const loginSessionId = localStorage.getItem('sessionId');
  const [selectedSession, setSelectedSession] = useState(loginSessionId || '');
  
  const [dexieConfAvg, setDexieConfAvg] = useState(0);
  const [finalOverall, setFinalOverall] = useState(0);
  const [hasDexieData, setHasDexieData] = useState(false);

  const teacherId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get('/Session/list');
        const sessionList = res.data || [];
        setSessions(sessionList);
        if (!selectedSession && sessionList.length > 0) {
          setSelectedSession(sessionList[0].id || sessionList[0].Id);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;

    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const res = await DataService.get(`/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${selectedSession}`);
        const backendData = res.data;

        const dexieRecords = await db.evaluations
          .where('teacherId').equals(String(teacherId))
          .and(item => String(item.sessionId) === String(selectedSession))
          .toArray();
        
        let currentDexieAvg = 0;
        if (dexieRecords.length > 0) {
          currentDexieAvg = dexieRecords.reduce((s, r) => s + r.score, 0) / dexieRecords.length;
          setDexieConfAvg(currentDexieAvg);
          setHasDexieData(true);
        } else {
          setHasDexieData(false);
          setDexieConfAvg(0);
        }

        let totalEarned = 0;
        let totalMax = 0;

        backendData.Breakdown.forEach(kpi => {
          totalMax += kpi.KPIWeight;
          let kpiPoints = 0;
          kpi.SubDetails.forEach(sub => {
            const isConf = sub.SubName.toLowerCase().includes('confidential');
            if (isConf && dexieRecords.length > 0) {
              kpiPoints += (currentDexieAvg / 4.0) * sub.SubMax;
            } else {
              // ✅ FIX: SubAchieved ko SubMax se zyada mat hone do
              kpiPoints += Math.min(sub.SubAchieved, sub.SubMax);
            }
          });
          // ✅ FIX: KPI points bhi KPIWeight se zyada nahi hone chahiye
          kpi.KPIAchieved = Math.min(kpiPoints, kpi.KPIWeight);
          totalEarned += kpi.KPIAchieved;
        });

        setFinalOverall(totalMax > 0 ? Math.min(100, Math.round((totalEarned / totalMax) * 100)) : 0);
        setData(backendData);
      } catch (err) {
        console.error("Error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformanceData();
  }, [selectedSession, teacherId]);

  // ✅ FIX: performance kabhi 100 se zyada nahi jayegi
  const getGraphData = () => {
    if (!data) return [];
    return data.Breakdown.flatMap(kpi => 
      kpi.SubDetails.map(sub => {
        let performance;
        if (sub.SubName.toLowerCase().includes('confidential') && hasDexieData) {
          performance = Math.round((dexieConfAvg / 4.0) * 100);
        } else {
          performance = Math.round((Math.min(sub.SubAchieved, sub.SubMax) / sub.SubMax) * 100) || 0;
        }
        // ✅ Hard clamp
        performance = Math.min(100, Math.max(0, performance));
        return {
          name: sub.SubName,
          performance,
          isConf: sub.SubName.toLowerCase().includes('confidential') && hasDexieData
        };
      })
    );
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* SESSION SELECTOR */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase italic text-slate-800 leading-none">Select Session</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">View performance</p>
            </div>
          </div>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full md:w-72 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black uppercase text-xs tracking-widest outline-none focus:border-green-600 transition-all cursor-pointer shadow-inner"
          >
            {sessions.map(s => (
              <option key={s.id || s.Id} value={s.id || s.Id}>
                {s.name || s.Name} {String(s.id || s.Id) === String(loginSessionId) ? "(Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-green-800 mb-4" size={50} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Analyzing Session Data...</p>
          </div>
        ) : data ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* SCOREBOARD */}
            <div className="bg-green-900 p-4 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                   {/* <TrendingUp size={20} className="text-green-400" /> */}
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Academic Analytics</span>
                </div>
                <h2 className="text-4xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Your Performance</h2>
                <p className="text-white font-bold text-sm uppercase tracking-[0.2em] mt-3">{data.SessionName}</p>
                {/* {hasDexieData && (
                  <div className="mt-6 flex items-center justify-center md:justify-start gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md">
                    <ShieldCheck size={16} className="text-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">See Overall Performance</span>
                  </div>
                )} */}
              </div>
              <div className="relative z-10 bg-white/5 p-6 rounded-[2rem] text-center min-w-[260px] border border-white/10 mt-8 md:mt-0 backdrop-blur-sm">
                <p className="text-[12px] font-bold uppercase opacity-50 tracking-[0.2em] mb-2">Average Score</p>
                <p className="text-5xl font-black leading-none tracking-tighter">{finalOverall}%</p>
              </div>
            </div>

            {/* GRAPH */}
            <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl italic">
                    <BarChart3 size={28}/>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Metric Analytics</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Performance Color Indicators</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase">80%+ Excellent</div>
                  <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase">60%+ Good</div>
                  <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase">40%+ Average</div>
                  <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase">&lt;40% Critical</div>
                </div>
              </div>

              <div className="h-[450px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGraphData()} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: '900', fill: '#64748b'}} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} dy={15} angle={-15} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} unit="%" />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          let status = "Critical"; let colorClass = "text-red-600";
                          if (val >= 80) { status = "Excellent"; colorClass = "text-green-600"; }
                          else if (val >= 60) { status = "Good"; colorClass = "text-amber-600"; }
                          else if (val >= 40) { status = "Average"; colorClass = "text-orange-600"; }
                          return (
                            <div className="bg-white p-5 shadow-2xl rounded-[2rem] border border-slate-50 min-w-[150px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.name}</p>
                              <p className={`text-3xl font-black ${colorClass}`}>{val}%</p>
                              <p className={`text-[10px] font-bold uppercase mt-1 ${colorClass}`}>{status}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="performance" radius={[12, 12, 4, 4]} barSize={50}>
                      {getGraphData().map((entry, index) => {
                        let barColor = "#ef4444";
                        if (entry.performance >= 80) barColor = "#22c55e";
                        else if (entry.performance >= 60) barColor = "#f59e0b";
                        else if (entry.performance >= 40) barColor = "#f97316";
                        if (entry.isConf) barColor = entry.performance >= 60 ? "#064e3b" : "#450a0a";
                        return <Cell key={`cell-${index}`} fill={barColor} className="hover:opacity-80 transition-all duration-300" />;
                      })}
                      <LabelList dataKey="performance" position="top" formatter={(v) => `${v}%`} style={{ fontWeight: '900', fontSize: '13px', fill: '#334155' }} dy={-10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data?.Breakdown.map((kpi, idx) => {
                const perc = Math.min(100, Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100) || 0);
                let cardColor = "text-red-700"; let progressColor = "bg-red-700";
                if (perc >= 80) { cardColor = "text-green-700"; progressColor = "bg-green-700"; }
                else if (perc >= 60) { cardColor = "text-amber-600"; progressColor = "bg-amber-600"; }
                else if (perc >= 40) { cardColor = "text-orange-600"; progressColor = "bg-orange-600"; }
                return (
                  <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 group-hover:bg-green-800 group-hover:text-white transition-colors duration-500">
                        {kpi.KPIName.toLowerCase().includes('student') ? <Users size={28}/> : <Award size={28}/>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Weight</p>
                        <p className="text-2xl font-black text-slate-800">{kpi.KPIWeight}%</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter mb-1">{kpi.KPIName}</h4>
                    <p className={`text-5xl font-black italic mb-6 ${cardColor}`}>{perc}%</p>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ NEW: SUB KPI BREAKDOWN CARDS */}
            <div className="space-y-4 pb-10">
              <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter px-2">
                Sub KPI Breakdown
              </h3>
              {data.Breakdown.flatMap((kpi) =>
                kpi.SubDetails.map((sub, idx) => {
                  const isConf = sub.SubName.toLowerCase().includes('confidential');

                  const achieved = (isConf && hasDexieData)
                    ? Math.round((dexieConfAvg / 4.0) * sub.SubMax)
                    : Math.min(sub.SubAchieved, sub.SubMax);

                  const finalPerc = Math.min(100, Math.round((achieved / sub.SubMax) * 100) || 0);

                  let finalBarColor = "bg-red-500";
                  let finalTextColor = "text-red-600";
                  if (finalPerc >= 80) { finalBarColor = "bg-green-600"; finalTextColor = "text-green-700"; }
                  else if (finalPerc >= 60) { finalBarColor = "bg-amber-500"; finalTextColor = "text-amber-600"; }
                  else if (finalPerc >= 40) { finalBarColor = "bg-orange-500"; finalTextColor = "text-orange-600"; }

                  return (
                    <div key={`${kpi.KPIName}-${idx}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
                      {/* Left: Names + Progress Bar */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {kpi.KPIName}
                        </p>
                        <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter truncate">
                          {sub.SubName}
                          {/* {isConf && hasDexieData && (
                            <span className="ml-2 text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black normal-case not-italic">
                              Local Data
                            </span>
                          )} */}
                        </h4>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner mt-3">
                          <div
                            className={`h-full ${finalBarColor} transition-all duration-1000`}
                            style={{ width: `${finalPerc}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: Score */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className={`text-3xl font-black ${finalTextColor}`}>
                          {achieved}
                          <span className="text-base text-slate-400 font-bold"> / {sub.SubMax}</span>
                        </p>
                        <p className={`text-[11px] font-black uppercase ${finalTextColor}`}>{finalPerc}%</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white p-20 rounded-[3.5rem] text-center border border-slate-100 shadow-sm">
            <Target className="mx-auto text-slate-200 mb-6" size={80} />
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">No Performance Data</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Data hasn't been uploaded for this session yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeePerformanceTeacher;